from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Import مدل‌ها
from models.user import User
from models.product import Product
from models.order import Order, OrderItem


# Security settings
SECRET_KEY = "my-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserInDB(User):
    hashed_password: str

class Main:
    def __init__(self):
        self.app = FastAPI(
            title="My Backend API",
            description="API ساده با FastAPI + Authentication",
            version="1.0.0"
        )
        self.users: List[UserInDB] = []  # ذخیره کاربران با hashed_password
        self.products: List[Product] = []
        self.orders: List[Order] = []
        
        # Create a test user for easy testing
        # Use a pre-hashed password to avoid bcrypt issues during init
        test_user = UserInDB(
            id=1,
            name="Test User",
            email="test@example.com",
            hashed_password="$2b$12$placeholderhashedpasswordforTestingOnly1234567890"
        )
        self.users.append(test_user)
        
        self.setup_routes()

    def setup_routes(self):
        """تعریف تمام روت‌ها (Endpoints)"""

        def verify_password(plain_password, hashed_password):
            return pwd_context.verify(plain_password, hashed_password)

        def get_password_hash(password):
            return pwd_context.hash(password)

        def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
            to_encode = data.copy()
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=15)
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt

        async def get_current_user(token: str = Depends(oauth2_scheme)):
            credentials_exception = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email: str = payload.get("sub")
                if email is None:
                    raise credentials_exception
                token_data = TokenData(email=email)
            except JWTError:
                raise credentials_exception
            user = next((u for u in self.users if u.email == token_data.email), None)
            if user is None:
                raise credentials_exception
            return user

        @self.app.get("/")
        async def root():
            return {"message": "خوش آمدید به API بک‌اند!", "status": "running"}

        # === Authentication Endpoints ===
        @self.app.post("/token", response_model=Token)
        async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
            user = next((u for u in self.users if u.email == form_data.username), None)
            if not user or not verify_password(form_data.password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}

        @self.app.post("/users/register", response_model=User)
        async def register_user(user: User, password: str):
            """ثبت‌نام کاربر جدید با رمز عبور"""
            if any(u.email == user.email for u in self.users):
                raise HTTPException(status_code=400, detail="Email already registered")
            
            hashed_password = get_password_hash(password)
            user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
            self.users.append(user_in_db)
            return user

        # === Protected User Endpoints ===
        @self.app.post("/users/", response_model=User, dependencies=[Depends(get_current_user)])
        async def create_user(user: User):
            """ایجاد کاربر جدید (نیاز به احراز هویت)"""
            if any(u.id == user.id for u in self.users):
                raise HTTPException(status_code=400, detail="User with this ID already exists")
            self.users.append(user)
            return user

        @self.app.get("/users/", response_model=List[User], dependencies=[Depends(get_current_user)])
        async def get_users():
            """دریافت لیست تمام کاربران (نیاز به احراز هویت)"""
            return [User(id=u.id, name=u.name, email=u.email) for u in self.users]

        @self.app.get("/users/{user_id}", response_model=User)
        async def get_user(user_id: int):
            """دریافت یک کاربر با ID"""
            for user in self.users:
                if user.id == user_id:
                    return user
            raise HTTPException(status_code=404, detail="User not found")

        @self.app.put("/users/{user_id}", response_model=User)
        async def update_user(user_id: int, updated_user: User):
            """به‌روزرسانی اطلاعات کاربر"""
            for idx, user in enumerate(self.users):
                if user.id == user_id:
                    self.users[idx] = updated_user
                    return updated_user
            raise HTTPException(status_code=404, detail="User not found")

        @self.app.delete("/users/{user_id}")
        async def delete_user(user_id: int):
            """حذف کاربر"""
            for idx, user in enumerate(self.users):
                if user.id == user_id:
                    deleted_user = self.users.pop(idx)
                    return {"message": f"User {deleted_user.name} deleted successfully"}
            raise HTTPException(status_code=404, detail="User not found")

        # === Protected Product Endpoints ===
        @self.app.post("/products/", response_model=Product, dependencies=[Depends(get_current_user)])
        async def create_product(product: Product):
            """ایجاد محصول جدید (نیاز به احراز هویت)"""
            if any(p.id == product.id for p in self.products):
                raise HTTPException(status_code=400, detail="Product with this ID already exists")
            self.products.append(product)
            return product

        @self.app.get("/products/", response_model=List[Product], dependencies=[Depends(get_current_user)])
        async def get_products():
            """دریافت لیست محصولات (نیاز به احراز هویت)"""
            return self.products

        @self.app.get("/products/{product_id}", response_model=Product, dependencies=[Depends(get_current_user)])
        async def get_product(product_id: int):
            """دریافت یک محصول (نیاز به احراز هویت)"""
            for product in self.products:
                if product.id == product_id:
                    return product
            raise HTTPException(status_code=404, detail="Product not found")

        # === Order Endpoints (CRUD + Payment) ===
        @self.app.post("/orders/", response_model=Order, dependencies=[Depends(get_current_user)])
        async def create_order(order: Order):
            """ایجاد سفارش جدید"""
            if any(o.id == order.id for o in self.orders):
                raise HTTPException(status_code=400, detail="Order with this ID already exists")
            
            # Validate products exist and calculate total if needed
            self.orders.append(order)
            return order

        @self.app.get("/orders/", response_model=List[Order], dependencies=[Depends(get_current_user)])
        async def get_orders():
            """دریافت لیست تمام سفارشات کاربر"""
            return self.orders

        @self.app.get("/orders/{order_id}", response_model=Order, dependencies=[Depends(get_current_user)])
        async def get_order(order_id: int):
            """دریافت جزئیات یک سفارش"""
            for order in self.orders:
                if order.id == order_id:
                    return order
            raise HTTPException(status_code=404, detail="Order not found")

        @self.app.put("/orders/{order_id}", response_model=Order, dependencies=[Depends(get_current_user)])
        async def update_order(order_id: int, updated_order: Order):
            """به‌روزرسانی سفارش"""
            for idx, order in enumerate(self.orders):
                if order.id == order_id:
                    self.orders[idx] = updated_order
                    return updated_order
            raise HTTPException(status_code=404, detail="Order not found")

        @self.app.delete("/orders/{order_id}", dependencies=[Depends(get_current_user)])
        async def delete_order(order_id: int):
            """حذف سفارش"""
            for idx, order in enumerate(self.orders):
                if order.id == order_id:
                    deleted = self.orders.pop(idx)
                    return {"message": f"Order {deleted.id} deleted successfully"}
            raise HTTPException(status_code=404, detail="Order not found")

        # === Payment Routes ===
        @self.app.post("/orders/{order_id}/pay", dependencies=[Depends(get_current_user)])
        async def process_payment(order_id: int):
            """پرداخت آنلاین سفارش (شبیه‌سازی)"""
            for order in self.orders:
                if order.id == order_id:
                    if order.payment_status == "paid":
                        raise HTTPException(status_code=400, detail="Order already paid")
                    
                    # شبیه‌سازی پرداخت موفق
                    order.payment_status = "paid"
                    order.status = "confirmed"
                    return {
                        "message": "پرداخت با موفقیت انجام شد",
                        "order_id": order.id,
                        "payment_status": "paid",
                        "new_status": order.status,
                        "amount": order.total_amount
                    }
            raise HTTPException(status_code=404, detail="Order not found")

        @self.app.get("/orders/{order_id}/payment-status", dependencies=[Depends(get_current_user)])
        async def get_payment_status(order_id: int):
            """بررسی وضعیت پرداخت"""
            for order in self.orders:
                if order.id == order_id:
                    return {
                        "order_id": order.id,
                        "payment_status": order.payment_status,
                        "status": order.status
                    }
            raise HTTPException(status_code=404, detail="Order not found")


# برای اجرای با uvicorn - instantiate app
main_instance = Main()
app = main_instance.app
