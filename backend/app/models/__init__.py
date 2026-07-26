# SQLModel table models live here.
# Import every model module so SQLModel.metadata is fully populated for Alembic.
from app.models.finance import (  # noqa: F401
    Account,
    Bill,
    BillPayment,
    Budget,
    Category,
    Goal,
    Transaction,
)
from app.models.ai import AiConversation, AiMessage  # noqa: F401
from app.models.insight import Insight, Notification  # noqa: F401
from app.models.profile import Profile, Settings  # noqa: F401
from app.models.user import (  # noqa: F401
    AuthIdentity,
    RefreshToken,
    User,
)
