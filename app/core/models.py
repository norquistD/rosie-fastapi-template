from pydantic import BaseModel, Field


# An example model to demonstrate the usage of BaseModel
class Example(BaseModel):
    id: int = Field(default=1)
    name: str = Field(default="John Doe")
    age: int = Field(default=21)
    email: str = Field(default="doej@msoe.edu")
