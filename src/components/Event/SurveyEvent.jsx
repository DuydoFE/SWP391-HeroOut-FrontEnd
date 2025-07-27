import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/axios";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const SurveyEvent = () => {
  const { id: eventId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [surveyResult, setSurveyResult] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Bạn cần đăng nhập để thực hiện khảo sát.");
      setLoading(false);
      return;
    }
    const fetchSurvey = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/surveys/event/${eventId}/${user.id}`);
        setSurvey(response.data);
      } catch (err) {
        console.error("Error fetching survey:", err);
        setError(
          err.response?.data?.message ||
            `Lỗi ${err.response?.status}: Không thể tải khảo sát.`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [eventId, user, authLoading]);

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const calculateAndSetResults = () => {
    let totalScore = 0;
    survey.questions.forEach((question) => {
      const selectedOptionId = answers[question.id];
      if (selectedOptionId) {
        const selectedOption = question.options.find(
          (opt) => opt.id === selectedOptionId
        );
        totalScore += selectedOption?.score || 0;
      }
    });
    setSurveyResult({ score: totalScore });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length !== survey.questions.length) {
      setSubmitError("Vui lòng trả lời tất cả các câu hỏi trước khi nộp.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    const payload = {
      eventId: parseInt(eventId, 10),
      accountId: user.id,
      answers: Object.entries(answers).map(([qid, oid]) => ({
        questionId: parseInt(qid, 10),
        selectedOptionId: parseInt(oid, 10),
      })),
    };
    try {
      await api.post("/survey-responses/submit", payload);
      calculateAndSetResults();
    } catch (err) {
      console.error("Error submitting survey:", err);
      setSubmitError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Đang tải khảo sát...
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="flex items-center mx-auto text-green-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại trang sự kiện
        </button>
      </div>
    );
  if (!survey)
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-600">Không tìm thấy khảo sát.</p>
      </div>
    );

  if (surveyResult) {
    return (
      <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center max-w-lg w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            Hoàn thành khảo sát!
          </h1>
          <p className="text-lg mt-2">Cảm ơn bạn đã tham gia.</p>
          <div className="my-6 p-4 bg-blue-100 rounded-lg">
            <p className="text-xl text-blue-800">Tổng điểm của bạn là:</p>
            <p className="text-4xl font-bold text-blue-900">
              {surveyResult.score}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 max-w-lg"
        >
          Quay lại trang sự kiện
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(`/events/${eventId}`)}
        className="mb-6 flex items-center text-green-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại trang sự kiện
      </button>
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          {survey.title}
        </h1>
        <form onSubmit={handleSubmit}>
          {survey.questions.map((question, qIndex) => (
            <div key={question.id} className="mb-8">
              <p className="text-xl font-semibold text-gray-700 mb-4">
                Câu {qIndex + 1}: {question.questionText}
              </p>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
                      answers[question.id] === option.id
                        ? "bg-green-50 border-green-400"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() =>
                        handleAnswerChange(question.id, option.id)
                      }
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-3 text-gray-800">{option.content}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {submitError && (
            <div
              className="flex items-center p-3 my-4 text-sm text-red-800 rounded-lg bg-red-100"
              role="alert"
            >
              <XCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-6 px-6 py-3 font-bold rounded-lg text-white transition-colors ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài và Xem kết quả"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SurveyEvent;
