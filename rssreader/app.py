#-*- coding: utf-8 -*-
from flask import Flask, json

from .config import config
from .database import db
from .extensions import login_manager
from .feed import feed_blueprint
from .frontend import frontend_blueprint
from .user import user_blueprint, User


blueprints = (frontend_blueprint, user_blueprint, feed_blueprint,)


class AdvancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, str):
            return o
        if hasattr(o, 'isoformat'):
            return o.isoformat()
        if hasattr(o, 'is_db_model'):
            fields = {}
            basic_fields = {field.name for field in o.__table__.columns}
            private_fields = set(getattr(o, '_private_fields', []))
            additional_fields = set(getattr(o, '_additional_fields', []))
            field_names = (basic_fields | additional_fields) - private_fields
            for field_name in field_names:
                obj = getattr(o, field_name)
                if isinstance(obj, str):
                    data = obj
                else:
                    data = json.dumps(obj)
                fields[field_name] = obj
            return fields
        return super(json.JSONEncoder, self).default(o)


def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='') # FIXME: is it correct name?

    app.config.from_object(config)

    for blueprint in blueprints:
        app.register_blueprint(blueprint)

    db.init()

    app.json_encoder = AdvancedJSONEncoder

    login_manager.login_view = 'user.login'
    @login_manager.user_loader
    def load_user(id):
        return User.query.get(id)
    login_manager.init_app(app)

    @app.teardown_appcontext
    def teardown_db(exception=None):
        db.teardown()
    return app
