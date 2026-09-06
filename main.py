from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Products
from database import session, engine
import database_models
from sqlalchemy.orm import Session

app = FastAPI()

# Allow the frontend (running on a different port) to call this API.
# allow_origins=["*"] is fine for local development; restrict it to
# your actual frontend URL (e.g. "http://localhost:3000") in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database_models.Base.metadata.create_all(bind=engine)


@app.get("/")
def greet():
    return "Hamayyah"


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


def init_db():
    db = session()
    count = db.query(database_models.Products).count()
    if count == 0:
        seed_products = [
            Products(id=1, name="phone", description="iphone",
                     price=50000.00, quantity=3),
            Products(id=13, name="laptops", description="macbooks",
                     price=99.99, quantity=1),
            Products(id=11, name="TV's", description="LG",
                     price=299.67, quantity=5),
            Products(id=10, name="ipad", description="apple",
                     price=199.99, quantity=17),
        ]
        for product in seed_products:
            db.add(database_models.Products(**product.model_dump()))
        db.commit()
    db.close()


init_db()


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    db_products = db.query(database_models.Products).all()
    return db_products


@app.get("/product/{id}")
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Products).filter(
        database_models.Products.id == id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@app.post("/products")
def add(product: Products, db: Session = Depends(get_db)):
    db_product = database_models.Products(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.put("/products/{id}")
def update(id: int, product: Products, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Products).filter(
        database_models.Products.id == id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    # FIX: don't let the body's id overwrite the primary key
    update_data = product.model_dump(exclude={"id"})
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@app.delete("/products/{id}")
def product_delete(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Products).filter(
        database_models.Products.id == id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    db.commit()
    return {"message": "product deleted successfully"}
