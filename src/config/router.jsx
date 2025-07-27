import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";
import Login from "../components/authentication/Login/Login";
import Register from "../components/authentication/Register";
import ForgotPassword from "../components/authentication/ForgotPassword";
import ProfilePage from "../pages/ProfilePage";
import CoursesPage from "../pages/CoursesPage";
import BlogsPage from "../pages/BlogsPage";
import BlogDetailPage from "../pages/BlogDetailPage";
import Layout from "../components/layout";
import CourseDetail from "../pages/CourseDetail";
import LearningCoursePage from "../pages/LearningCoursePage";
import EventPage from "../pages/EventPage";
import ConsultationPage from "../pages/ConsultationPage";
import ConsultantDetailPage from "../pages/ConsultantDetailPage";
import BookingPage from "../pages/BookingPage";
import StaffLayout from "../components/layout/StaffLayout";
import StaffDashboard from "../components/staff/StaffDashBoard";
import StaffCourse from "../components/staff/StaffCourse";
import StaffMember from "../components/staff/StaffMember";
import StaffSurvey from "../components/staff/StaffSurvey";
import StaffBlog from "../components/staff/StaffBlog";
import StaffEvent from "../components/staff/StaffEvent";
import StaffMeeting from "../components/staff/StaffMeeting";
import RiskSurvey from "../components/RiskSurvey";
import ProtectedRoute from "../components/ProtectedRoute";
import EventDetail from "../components/Event/EventDetail";

import SurveyEvent from "../components/Event/SurveyEvent";
import MemberProtectedRoute from "../components/MemberProtectedRoute";
import AccomplishmentsPage from "../pages/AccomplishmentsPage";
import MyAppointmentsPage from "../pages/MyAppointmentsPage";
import StaffViewMeetings from "../components/staff/StaffViewMeetings";
import RiskLevel from "../pages/RiskLevel";
import ResetPassword from "../components/authentication/ResetPassword";
import MyEventsPage from "../components/Event/MyEvent";

export const router = createBrowserRouter([
  {
    path: "",
    element: (
      <MemberProtectedRoute>
        <Layout />
      </MemberProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/blogs",
        element: <BlogsPage />,
      },
      {
        path: "/blogs/:id",
        element: <BlogDetailPage />,
      },
      {
        path: "/courses",
        element: <CoursesPage />,
      },
      {
        path: "/coursedetail/:id",
        element: <CourseDetail />,
      },
      {
        path: "/event",
        element: <EventPage />,
      },
      {
        path: "/events/:id",
        element: <EventDetail />,
      },

      {
        path: "/survey-event/:id",
        element: (
          <ProtectedRoute>
            <SurveyEvent />
          </ProtectedRoute>
        ),
      },
      {
        path: "/myevent",
        element: (
          <ProtectedRoute>
            <MyEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/consultation",
        element: <ConsultationPage />,
      },
      {
        path: "/consultants/:id",
        element: <ConsultantDetailPage />,
      },
      {
        path: "/booking/",
        element: (
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/booking/:consultantId",
        element: (
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/risklevel",
        element: (
          <ProtectedRoute>
            <RiskLevel />
          </ProtectedRoute>
        ),
      },
      {
        path: "/risksurvey",
        element: (
          <ProtectedRoute>
            <RiskSurvey />
          </ProtectedRoute>
        ),
      },
      {
        path: "/myaccomplishments",
        element: (
          <ProtectedRoute>
            <AccomplishmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my-appointments",
        element: (
          <ProtectedRoute>
            <MyAppointmentsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "learningcourse/:id",
    element: (
      <MemberProtectedRoute>
        <ProtectedRoute>
          <LearningCoursePage />
        </ProtectedRoute>
      </MemberProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Register />
      </ProtectedRoute>
    ),
  },
  {
    path: "/forgotpassword",
    element: (
      <ProtectedRoute requireAuth={false}>
        <ForgotPassword />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <ProtectedRoute requireAuth={false}>
        <ResetPassword />
      </ProtectedRoute>
    ),
  },

  {
    path: "",
    element: (
      <ProtectedRoute requireStaffRole={true}>
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <StaffDashboard />,
      },
      {
        path: "managemembers",
        element: <StaffMember />,
      },
      {
        path: "managecourses",
        element: <StaffCourse />,
      },
      {
        path: "managesurveys",
        element: <StaffSurvey />,
      },
      {
        path: "manageblogs",
        element: <StaffBlog />,
      },
      {
        path: "manageevents",
        element: <StaffEvent />,
      },
      {
        path: "managemeetings",
        element: <StaffMeeting />,
      },
      {
        path: "viewconsultantmeeting",
        element: <StaffViewMeetings />,
      },
    ],
  },
]);
