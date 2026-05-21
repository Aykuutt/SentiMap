from flask_sqlalchemy import SQLAlchemy

# SQLAlchemy database instance'ı burada tanımlanarak circular import (döngüsel import) hataları önlenir.
db = SQLAlchemy()
