import uvicorn
from qrda_real_api import app

if __name__ == "__main__":
    uvicorn.run("qrda_real_api:app", host="127.0.0.1", port=8001, reload=True)
