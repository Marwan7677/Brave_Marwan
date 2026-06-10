from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItem(BaseModel):
    product_id: int
    quantity: int
    price: float

class Order(BaseModel):
    id: int
    user_id: int
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    created_at: datetime = datetime.now()
    payment_status: str = "unpaid"  # unpaid, paid, failed
    description: Optional[str] = None
