from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    ProgramView,
    ParticipantListView,
    ParticipantDetailView,
    AbstractListView,
    AbstractDetailView,
    TalkListView,
    TalkDetailView,
    OrganizerListAPIView,
    OrganizingCommitteeListAPIView,
    AdminPanelView, SubmissionCreateView, SubmissionListView, SubmissionDetailView, publish_submission, UnscheduledTalksView, TalkScheduleUpdateView
)

urlpatterns = [
    # Public endpoints
    path("program/", ProgramView.as_view(), name="program"),
    path("participants/", ParticipantListView.as_view(), name="participant-list"),
    path("participants/<int:pk>/", ParticipantDetailView.as_view(), name="participant-detail"),
    path("abstracts/", AbstractListView.as_view(), name="abstract-list"),
    path("abstracts/<int:pk>/", AbstractDetailView.as_view(), name="abstract-detail"),
    path("talks/", TalkListView.as_view(), name="talk-list"),
    path("talks/<int:pk>/", TalkDetailView.as_view(), name="talk-detail"),
    path("organizers/", OrganizerListAPIView.as_view(), name="organizer-list"),
    path("committees/", OrganizingCommitteeListAPIView.as_view(), name="committee-list"),
    
    # Public submission form
    path("submit/", SubmissionCreateView.as_view(), name="submission-create"),
    
    # Admin endpoints
    path("admin-panel/", AdminPanelView.as_view(), name="admin-panel"),
    path("admin/submissions/", SubmissionListView.as_view(), name="submissions-list"),
    path("admin/submissions/<int:pk>/", SubmissionDetailView.as_view(), name="submission-detail"),
    path("admin/submissions/<int:pk>/publish/", publish_submission, name="submission-publish"),
    # Admin: unscheduled talks
    path("admin/talks/unscheduled/", UnscheduledTalksView.as_view(), name="unscheduled-talks"),
    path("admin/talks/<int:pk>/schedule/", TalkScheduleUpdateView.as_view(), name="talk-schedule"),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)