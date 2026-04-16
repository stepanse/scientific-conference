# Create your views here.

from urllib import request

from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import *
from .serializers import *


class ReactView(APIView):
    serializer_class = ReactSerializer

    def get(self, request):
        detail = [{"name": detail.name, "detail": detail.detail} 
                  for detail in React.objects.all()]
        return Response(detail)

    def post(self, request):
        serializer = ReactSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)


# Program: all days with timeline
class ProgramView(generics.ListAPIView):
    queryset = ConferenceDay.objects.all().order_by("date")
    serializer_class = ConferenceDaySerializer


# Participants
class ParticipantListView(generics.ListCreateAPIView):
    queryset = Participant.objects.all().order_by("name")
    serializer_class = ParticipantSerializer


class ParticipantDetailView(generics.RetrieveAPIView):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer


# Abstracts
class AbstractListView(generics.ListCreateAPIView):
    queryset = Abstract.objects.all().order_by("title")
    serializer_class = AbstractSerializer


class AbstractDetailView(generics.RetrieveAPIView):
    queryset = Abstract.objects.all()
    serializer_class = AbstractSerializer


# Talks (optional endpoints)
class TalkListView(generics.ListAPIView):
    queryset = Talk.objects.all().order_by("day", "start_time")
    serializer_class = TalkSerializer


class TalkDetailView(generics.RetrieveAPIView):
    queryset = Talk.objects.all()
    serializer_class = TalkSerializer


class OrganizerListAPIView(generics.ListAPIView):
    queryset = Organizer.objects.all()
    serializer_class = OrganizerSerializer


class OrganizingCommitteeListAPIView(generics.ListAPIView):
    queryset = OrganizingCommittee.objects.all()
    serializer_class = OrganizingCommitteeSerializer


# Admin Panel - JWT
class AdminPanelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "message": "Welcome to admin panel",
            "user": request.user.username
        })


class SubmissionCreateView(generics.CreateAPIView):
    queryset = ParticipantSubmission.objects.all()
    serializer_class = ParticipantSubmissionSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class SubmissionListView(generics.ListAPIView):
    queryset = ParticipantSubmission.objects.all()
    serializer_class = ParticipantSubmissionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            return ParticipantSubmission.objects.filter(status=status_filter)
        return ParticipantSubmission.objects.all()


class SubmissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ParticipantSubmission.objects.all()
    serializer_class = ParticipantSubmissionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

# Admin: get unscheduled talks (talks without time/day)
class UnscheduledTalksView(generics.ListAPIView):
    serializer_class = TalkSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # Talks без времени или дня
        return Talk.objects.filter(is_scheduled=False).select_related('participant', 'abstract')


# Admin: update talk schedule
class TalkScheduleUpdateView(generics.UpdateAPIView):
    queryset = Talk.objects.all()
    serializer_class = TalkSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    
    def update(self, request, *args, **kwargs):
        talk = self.get_object()

        day_id = request.data.get('day')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')

        if not day_id or not start_time or not end_time:
            return Response(
            {"error": "day, start_time and end_time are required"},
            status=status.HTTP_400_BAD_REQUEST
            )
        
        talk.day_id = day_id
        talk.session_id = request.data.get('session')  
        talk.start_time = start_time   
        talk.end_time = end_time
        talk.is_scheduled = True
        talk.save()
        
        serializer = self.get_serializer(talk)
        return Response(serializer.data)

# Admin: publish submission
@api_view(['POST'])
def publish_submission(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Admin only"}, status=403)
    
    try:
        submission = ParticipantSubmission.objects.get(pk=pk)
    except ParticipantSubmission.DoesNotExist:
        return Response({"error": "Submission not found"}, status=404)
    
    if submission.status == 'approved':
        return Response({
            "message": "Already published",
            "participant_id": submission.published_participant.id if submission.published_participant else None,
            "abstract_id": submission.published_abstract.id if submission.published_abstract else None
        }, status=200)
    
    try:
        participant, abstract, talk = submission.publish()
        
        return Response({
            "message": "Published successfully",
            "participant_id": participant.id,
            "abstract_id": abstract.id if abstract else None,
            "participant_name": participant.name,
            "abstract_title": abstract.title if abstract else None,
            "talk_id": talk.id if talk else None,  
            "talk_created": talk is not None  
        }, status=200)
    except Exception as e:
        import traceback
        traceback.print_exc()  # Для отладки
        return Response({
            "error": f"Failed to publish: {str(e)}"
        }, status=500)
    
class UnscheduledTalkDeleteView(generics.DestroyAPIView):
    queryset = Talk.objects.all()
    serializer_class = TalkSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        talk = self.get_object()

        if talk.is_scheduled:
            return Response(
                {"error": "Cannot delete a scheduled talk from here"},
                status=status.HTTP_400_BAD_REQUEST
            )

        talk.delete()
        return Response({"message": "Talk deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    
# Admin: create a break/event in schedule
class ScheduleBreakCreateView(generics.CreateAPIView):
    queryset = Talk.objects.all()
    serializer_class = TalkSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        day_id = request.data.get('day')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        title = request.data.get('title', 'Break')
        talk_type = request.data.get('talk_type', 'break')

        if not day_id or not start_time or not end_time:
            return Response(
                {"error": "day, start_time and end_time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        talk = Talk.objects.create(
            title=title,
            talk_type=talk_type,
            day_id=day_id,
            start_time=start_time,
            end_time=end_time,
            is_scheduled=True,
        )

        serializer = self.get_serializer(talk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
# Admin: create session
class SessionCreateView(generics.CreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        day_id = request.data.get('day')
        chair = request.data.get('chair', '')

        if not day_id:
            return Response(
                {"error": "day is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = Session.objects.create(
            day_id=day_id,
            chair=chair,
        )

        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
class SessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        day_id = self.request.query_params.get('day', None)
        if day_id:
            return Session.objects.filter(day_id=day_id)
        return Session.objects.all()
    
class ConferenceDayCreateView(generics.CreateAPIView):
    queryset = ConferenceDay.objects.all()
    serializer_class = ConferenceDaySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

class SessionUpdateTimeView(generics.UpdateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    http_method_names = ['patch']