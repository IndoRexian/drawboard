from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Config(BaseSettings):
    app_name: str = "Drawboard"
    debug: bool = True  # False

    APP_SECRET_KEY: str

    model_config = SettingsConfigDict(env_file=".env")


config = Config()
