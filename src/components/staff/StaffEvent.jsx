import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, MapPin, Plus, Edit2, Trash2, Search, Filter, X, CheckCircle, Circle, UserCheck, UserX, ClipboardList, FileText, HelpCircle
} from 'lucide-react';
import api from '../../services/axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';



const StatBox = ({ title, value, color = "text-gray-900" }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <p className="text-sm text-gray-600 font-bold mb-2">{title}</p>
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
  </div>
);

const StaffEvent = () => {
  // State
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [editEventData, setEditEventData] = useState({
    title: '', description: '', location: '', startTime: '', endTime: ''
  });
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', location: '', startTime: '', endTime: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Participant modal state
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participantSearch, setParticipantSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'checkin', 'checkout'
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [registeredParticipants, setRegisteredParticipants] = useState([]);
  const [checkedInParticipants, setCheckedInParticipants] = useState([]);
  const [checkedOutParticipants, setCheckedOutParticipants] = useState([]);


  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyList, setSurveyList] = useState([]);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    questions: [
      { questionText: '', options: [{ content: '', score: 0 }] }
    ]
  });
  const [surveyEventId, setSurveyEventId] = useState(null);
  const [surveyToEdit, setSurveyToEdit] = useState(null);
  const [editSurveyData, setEditSurveyData] = useState({
    title: '',
    questions: []
  });
  const [surveyToDelete, setSurveyToDelete] = useState(null);



  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const fetchAllParticipants = async (eventId) => {
    setLoadingParticipants(true);
    try {
      const [registeredRes, checkedInRes, checkedOutRes] = await Promise.all([
        api.get(`/participations/${eventId}/registered`, { params: { eventId } }),
        api.get(`/participations/${eventId}/checked-in`, { params: { eventId } }),
        api.get(`/participations/${eventId}/checked-out`, { params: { eventId } }),
      ]);
      setRegisteredParticipants(registeredRes.data);
      setCheckedInParticipants(checkedInRes.data);
      setCheckedOutParticipants(checkedOutRes.data);
    } catch (error) {
      setRegisteredParticipants([]);
      setCheckedInParticipants([]);
      setCheckedOutParticipants([]);
      console.error('Lỗi khi lấy danh sách người tham gia:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Derived values


  // Handlers
  const handleEditClick = (event) => {
    setEventToEdit(event);
    setEditEventData({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startTime: event.startTime ? event.startTime.slice(0, 16) : '',
      endTime: event.endTime ? event.endTime.slice(0, 16) : ''
    });
  };

  const handleManageParticipants = (event) => {
    setSelectedEvent(event);
    setShowParticipantModal(true);
    setParticipantSearch('');
    setActiveTab('all');
    fetchAllParticipants(event.id);
  };

  const handleCreateEvent = async () => {
    const { title, location, startTime, endTime } = newEvent;

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự kiện.');
      return;
    }
    if (!location.trim()) {
      toast.error('Vui lòng nhập địa điểm.');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      toast.error('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    try {
      const response = await api.post('/events', { ...newEvent, participants: [] });
      setEvents(prev => [...prev, response.data]);
      setShowModal(false);
      setNewEvent({ title: '', description: '', location: '', startTime: '', endTime: '' });
      toast.success('Tạo sự kiện thành công!');
    } catch (error) {
      console.error('Lỗi khi tạo sự kiện:', error);
      toast.error('Đã xảy ra lỗi khi tạo sự kiện.');
    }
  };


  const handleDeleteEvent = async (id) => {
    setEventToDelete(null);
    if (!id) return;

    try {
      await api.delete(`/events/${id}`);
      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Xóa sự kiện thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa sự kiện:', error);
      toast.error('Đã xảy ra lỗi khi xóa sự kiện.');
    }
  };


  const handleUpdateEvent = async () => {
    if (!eventToEdit) return;

    const { title, location, startTime, endTime } = editEventData;

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự kiện.');
      return;
    }
    if (!location.trim()) {
      toast.error('Vui lòng nhập địa điểm.');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      toast.error('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    try {
      const response = await api.put(`/events/${eventToEdit.id}`, {
        ...eventToEdit,
        ...editEventData
      });
      setEvents(prev => prev.map(ev => (ev.id === eventToEdit.id ? response.data : ev)));
      setEventToEdit(null);
      toast.success('Cập nhật sự kiện thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật sự kiện:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật sự kiện.');
    }
  };


  const handleCheckIn = async (participantId) => {
    try {
      await api.put(`/participations/participations/${participantId}/checkin`);
      if (selectedEvent) {
        await fetchAllParticipants(selectedEvent.id);
      }
    } catch (error) {
      console.error('Lỗi khi check-in:', error);
    }
  };

  const handleCheckOut = async (participantId) => {
    try {
      await api.put(`/participations/participations/${participantId}/checkout`);
      if (selectedEvent) {
        await fetchAllParticipants(selectedEvent.id);
      }
    } catch (error) {
      console.error('Lỗi khi check-out:', error);
    }
  };

  const handleShowSurveys = async (event) => {
    setSurveyLoading(true);
    setShowSurveyModal(true);
    try {
      const res = await api.get(`/surveys/event/${event.id}/${user.id}`);
      if (Array.isArray(res.data)) {
        setSurveyList(res.data);
      } else if (res.data && typeof res.data === 'object') {
        setSurveyList([res.data]);
      } else {
        setSurveyList([]);
      }
    } catch (error) {
      setSurveyList([]);
    } finally {
      setSurveyLoading(false);
    }
  };

  const createSurvey = async (surveyData) => {
    if (!surveyData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề khảo sát.');
      return null;
    }
    if (!surveyData.questions || surveyData.questions.length === 0) {
      toast.error('Phải có ít nhất một câu hỏi.');
      return null;
    }

    for (let i = 0; i < surveyData.questions.length; i++) {
      const q = surveyData.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Câu hỏi ${i + 1} chưa có nội dung.`);
        return null;
      }
      if (!q.options || q.options.length === 0) {
        toast.error(`Câu hỏi ${i + 1} phải có ít nhất một lựa chọn.`);
        return null;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].content.trim()) {
          toast.error(`Câu hỏi ${i + 1}, lựa chọn ${j + 1} chưa có nội dung.`);
          return null;
        }
      }
    }

    // Chuẩn bị payload sạch
    const cleanQuestions = surveyData.questions.map(q => ({
      questionText: q.questionText,
      options: q.options.map(opt => ({ content: opt.content, score: opt.score }))
    }));

    const payload = {
      eventId: surveyEventId,
      title: surveyData.title,
      questions: cleanQuestions
    };

    try {
      const response = await api.post('/surveys', payload);
      toast.success('Tạo khảo sát thành công!');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo khảo sát:', error);
      toast.error('Đã xảy ra lỗi khi tạo khảo sát.');
      return null;
    }
  };



  const handleUpdateSurvey = async () => {
    if (!surveyEventId) return;

    if (!editSurveyData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề khảo sát.');
      return;
    }
    if (!editSurveyData.questions || editSurveyData.questions.length === 0) {
      toast.error('Phải có ít nhất một câu hỏi.');
      return;
    }

    for (let i = 0; i < editSurveyData.questions.length; i++) {
      const q = editSurveyData.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Câu hỏi ${i + 1} chưa có nội dung.`);
        return;
      }
      if (!q.options || q.options.length === 0) {
        toast.error(`Câu hỏi ${i + 1} phải có ít nhất một lựa chọn.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].content.trim()) {
          toast.error(`Câu hỏi ${i + 1}, lựa chọn ${j + 1} chưa có nội dung.`);
          return;
        }
      }
    }

    try {
      const cleanQuestions = editSurveyData.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options.map(opt => ({
          id: opt.id,
          content: opt.content,
          score: opt.score,
          questionId: opt.questionId
        }))
      }));

      const payload = { eventId: surveyEventId, title: editSurveyData.title, questions: cleanQuestions };
      const response = await api.put(`/surveys/event/${surveyEventId}`, payload);

      setSurveyList(prev => prev.map(sv => (sv.id === surveyToEdit.id ? response.data : sv)));
      setSurveyToEdit(null);
      toast.success('Cập nhật khảo sát thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật khảo sát:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật khảo sát.');
    }
  };



  const handleEditSurveyClick = (survey) => {
    setShowSurveyModal(false);
    setSurveyToEdit(survey);
    setEditSurveyData({
      title: survey.title || '',
      questions: survey.questions ? JSON.parse(JSON.stringify(survey.questions)) : []
    });
    setSurveyEventId(survey.eventId);
  };

  const handleDeleteSurvey = async () => {
    if (!surveyToDelete || !surveyToDelete.eventId) return;

    try {
      await api.delete(`/surveys/event/${surveyToDelete.eventId}`);

      setSurveyList(prev => prev.filter(sv => sv.eventId !== surveyToDelete.eventId));
      setSurveyToDelete(null);

      if (surveyEventId) {
        await handleShowSurveys({ id: surveyEventId });
      }

      toast.success('Xóa khảo sát thành công!');
    } catch (error) {
      console.error('Lỗi khi xoá khảo sát:', error);
      toast.error('Đã xảy ra lỗi khi xóa khảo sát.');
    }
  };

  // Filter participants based on search and tab
  const getFilteredParticipants = () => {
    if (!selectedEvent) return [];
    const search = participantSearch.toLowerCase();
    if (activeTab === 'all') {
      return registeredParticipants.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.email && p.email.toLowerCase().includes(search)) ||
          (p.accountName && p.accountName.toLowerCase().includes(search)) ||
          (p.accountGmail && p.accountGmail.toLowerCase().includes(search))
      );
    }
    if (activeTab === 'checkin') {
      return checkedInParticipants.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.email && p.email.toLowerCase().includes(search)) ||
          (p.accountName && p.accountName.toLowerCase().includes(search)) ||
          (p.accountGmail && p.accountGmail.toLowerCase().includes(search))
      );
    }
    if (activeTab === 'checkout') {
      return checkedOutParticipants.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.email && p.email.toLowerCase().includes(search)) ||
          (p.accountName && p.accountName.toLowerCase().includes(search)) ||
          (p.accountGmail && p.accountGmail.toLowerCase().includes(search))
      );
    }
    return [];
  };

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-lg">Loading...</div>;

  return (
    <div className="p-8 space-y-8 bg-gradient-to-r from-blue-50 to-indigo-100 min-h-screen">
      {/* Delete Event Modal */}
      {eventToDelete && (
        <ModalConfirmDelete
          event={eventToDelete}
          onCancel={() => setEventToDelete(null)}
          onConfirm={() => handleDeleteEvent(eventToDelete.id)}
        />
      )}

      {/* Create Event Modal */}
      {showModal && (
        <ModalEventForm
          title="Tạo sự kiện mới"
          eventData={newEvent}
          setEventData={setNewEvent}
          onCancel={() => setShowModal(false)}
          onSubmit={handleCreateEvent}
          submitLabel="Tạo sự kiện"
        />
      )}
      {showSurveyModal && !showCreateSurveyModal && (
        <ModalSurveyList
          loading={surveyLoading}
          surveys={surveyList}
          onClose={() => setShowSurveyModal(false)}
          onCreateSurvey={() => setShowCreateSurveyModal(true)}
          onEditSurvey={handleEditSurveyClick}
          onDeleteSurvey={(survey) => {
            setSurveyToDelete(survey);
            setShowSurveyModal(false); // Ẩn ModalSurveyList khi modal xác nhận hiện ra
          }}
        />
      )}
      {showCreateSurveyModal && (
        <ModalCreateSurvey
          surveyData={newSurvey}
          setSurveyData={setNewSurvey}
          onCancel={() => setShowCreateSurveyModal(false)}
          onSubmit={async () => {
            const created = await createSurvey(newSurvey); // Gọi API tạo survey
            if (created) {
              setShowCreateSurveyModal(false); // Chỉ đóng nếu tạo thành công
              setNewSurvey({
                title: '',
                questions: [{ questionText: '', options: [{ content: '', score: 0 }] }]
              });
              if (surveyEventId) {
                await handleShowSurveys({ id: surveyEventId });
              }
            }
          }}

        />
      )}

      {/* Edit Event Modal */}
      {eventToEdit && (
        <ModalEventForm
          title="Chỉnh sửa sự kiện"
          eventData={editEventData}
          setEventData={setEditEventData}
          onCancel={() => setEventToEdit(null)}
          onSubmit={handleUpdateEvent}
          submitLabel="Lưu thay đổi"
        />
      )}

      {/* Participant Management Modal */}
      {showParticipantModal && selectedEvent && (
        <ModalParticipants
          event={selectedEvent}
          loading={loadingParticipants}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          participantSearch={participantSearch}
          setParticipantSearch={setParticipantSearch}
          getFilteredParticipants={getFilteredParticipants}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onClose={() => setShowParticipantModal(false)}
          registeredParticipants={registeredParticipants}
          checkedInParticipants={checkedInParticipants}
          checkedOutParticipants={checkedOutParticipants}
        />
      )}
      {surveyToEdit && (
        <ModalEditSurvey
          title="Chỉnh sửa khảo sát"
          surveyData={editSurveyData}
          setSurveyData={setEditSurveyData}
          onCancel={() => {
            setSurveyToEdit(null);
            setShowSurveyModal(true);
          }}
          onSubmit={handleUpdateSurvey}
          submitLabel="Lưu thay đổi"
        />
      )}
      {surveyToDelete && (
        <ModalConfirmDeleteSurvey
          survey={surveyToDelete}
          onCancel={() => {
            setSurveyToDelete(null);
            setShowSurveyModal(true);
          }}
          onConfirm={handleDeleteSurvey}
        />
      )}




      {/* Dashboard */}
      <h1 className="text-3xl font-bold text-gray-800">Event Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-6">
        <StatBox
          title="Tổng sự kiện"
          value={events.length}
          color="text-gray-900"
        />
      </div>



      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">Quản lý Sự kiện</h2>
          <p className="text-gray-500 text-base">Tổ chức và theo dõi các sự kiện của bạn</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-base font-medium hover:opacity-90"
        >
          <Plus size={18} className="inline mr-2" />
          Tạo Sự kiện
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center flex-grow bg-white border rounded-xl px-6 py-3 shadow-md">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            className="flex-grow outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-white border rounded-xl px-5 py-3 shadow-sm text-base font-medium">
          <Filter size={18} />
          Tất cả
        </button>
      </div>

      {/* Event Table - Đã sửa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sự kiện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian kết thúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event, index) => (
                <tr
                  key={event.id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleManageParticipants(event)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.startTime?.slice(0, 16).replace('T', '  ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.endTime?.slice(0, 16).replace('T', '  ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                    <button
                      className="text-green-500 hover:text-green-700"
                      title="Bài Khảo Sát"
                      onClick={e => {
                        e.stopPropagation();
                        setSurveyEventId(event.id);
                        handleShowSurveys(event);
                      }}
                    >
                      <ClipboardList className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        handleEditClick(event);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      className="text-red-500 hover:text-red-700"
                      title="Xóa"
                      onClick={e => { e.stopPropagation(); setEventToDelete(event); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Modal: Confirm Delete
function ModalConfirmDelete({ event, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xóa sự kiện</h2>
        <p className="mb-6">
          Bạn có chắc muốn xóa sự kiện <span className="font-semibold">{event.title}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Create/Edit Event
function ModalEventForm({ title, eventData, setEventData, onCancel, onSubmit, submitLabel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
        {/* Header với gradient accent */}
        <div className="relative mb-6">
          <h2 className="text-2xl font-bold text-gray-800 relative z-10">{title}</h2>
        </div>

        {/* Tiêu đề và Địa điểm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></span>
              Tiêu đề sự kiện
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề sự kiện"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
              value={eventData.title}
              onChange={e => setEventData({ ...eventData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mr-2"></span>
              Địa điểm
            </label>
            <input
              type="text"
              placeholder="Nhập địa điểm"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
              value={eventData.location}
              onChange={e => setEventData({ ...eventData, location: e.target.value })}
            />
          </div>
        </div>

        {/* Thời gian bắt đầu và kết thúc */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">⏰</span>
            Thời gian diễn ra
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <span className="text-lg mr-2">🟢</span>
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                value={eventData.startTime}
                onChange={e => setEventData({ ...eventData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <span className="text-lg mr-2">🔴</span>
                Thời gian kết thúc
              </label>
              <input
                type="datetime-local"
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                value={eventData.endTime}
                onChange={e => setEventData({ ...eventData, endTime: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div className="mb-8 space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2"></span>
            Mô tả sự kiện
          </label>
          <textarea
            placeholder="Nhập mô tả chi tiết về sự kiện..."
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 resize-none"
            rows={4}
            value={eventData.description}
            onChange={e => setEventData({ ...eventData, description: e.target.value })}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSubmit}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold flex items-center justify-center gap-2 min-w-[140px]"
          >

            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Participants
function ModalParticipants({
  event,
  loading,
  activeTab,
  setActiveTab,
  participantSearch,
  setParticipantSearch,
  getFilteredParticipants,
  onCheckIn,
  onCheckOut,
  onClose,
  registeredParticipants,
  checkedInParticipants,
  checkedOutParticipants
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Quản lý Người tham gia</h2>
            <p className="text-blue-100 mt-1">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <div className="flex items-center bg-gray-50 border rounded-xl px-4 py-3 mb-6">
            <Search size={20} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="flex-grow outline-none bg-transparent text-base"
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
            />
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <TabButton
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              color="blue"
              icon={<Users size={18} className="inline mr-2" />}
              label={`Đã đăng ký (${registeredParticipants.length})`}
            />
            <TabButton
              active={activeTab === 'checkin'}
              onClick={() => setActiveTab('checkin')}
              color="green"
              icon={<UserCheck size={18} className="inline mr-2" />}
              label={`Check-in (${checkedInParticipants.length})`}
            />
            <TabButton
              active={activeTab === 'checkout'}
              onClick={() => setActiveTab('checkout')}
              color="red"
              icon={<UserX size={18} className="inline mr-2" />}
              label={`Check-out (${checkedOutParticipants.length})`}
            />
          </div>
          {/* List */}
          <div className="relative max-h-96 overflow-y-auto">
            {/* Overlay loading khi đang tải */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            )}
            <div className={loading ? "opacity-50 pointer-events-none" : ""}>
              {getFilteredParticipants().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">
                    {participantSearch
                      ? 'Không tìm thấy người tham gia nào'
                      : 'Chưa có người tham gia nào'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredParticipants().map((participant) => (
                    <ParticipantItem
                      key={participant.id}
                      participant={participant}
                      onCheckIn={onCheckIn}
                      onCheckOut={onCheckOut}
                      activeTab={activeTab}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Button
function TabButton({ active, onClick, color, icon, label }) {
  const colorClass = active
    ? `border-${color}-500 text-${color}-600`
    : 'border-transparent text-gray-500 hover:text-gray-700';
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-base border-b-2 transition-colors ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}

// Participant Item
function ParticipantItem({ participant, onCheckIn, onCheckOut, activeTab }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {participant.accountName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Tên:</span> {participant.accountName || '-'}
          </p>
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Email:</span> {participant.accountGmail || '-'}
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${participant.checkedIn
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
              }`}>
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${participant.checkedOut
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
              }`}>
            </span>
          </div>
        </div>
      </div>
      {/* Nút Check-in/Check-out theo tab */}
      <div className="flex items-center gap-3">
        {activeTab === 'all' && !participant.checkedIn && (
          <button
            onClick={() => onCheckIn(participant.id)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            Check-in
          </button>
        )}
        {activeTab === 'checkin' && !participant.checkedOut && (
          <button
            onClick={() => onCheckOut(participant.id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Check-out
          </button>
        )}
        {/* Tab checkout không có nút */}
      </div>
    </div>
  );
}


function ModalSurveyList({ loading, surveys, onClose, onCreateSurvey, onEditSurvey, onDeleteSurvey }) {
  const safeSurveys = Array.isArray(surveys) ? surveys : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <FileText size={28} />
            <div>
              <h2 className="text-2xl font-bold">Danh sách câu hỏi khảo sát</h2>
              <p className="text-blue-100 text-sm mt-1">
                Quản lý và xem chi tiết các bài khảo sát
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content với thanh cuộn dọc */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg">Đang tải dữ liệu...</p>
            </div>
          ) : safeSurveys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <FileText size={48} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chưa có bài khảo sát nào</h3>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                Tạo bài khảo sát đầu tiên để bắt đầu thu thập phản hồi từ người dùng
              </p>
              <button
                onClick={onCreateSurvey}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                + Tạo khảo sát mới
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Surveys List */}
              <div className="space-y-6">
                {safeSurveys.map((survey, surveyIndex) => (
                  <div
                    key={survey.id || survey.title || surveyIndex}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Survey Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FileText className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {survey.title || `Khảo sát ${surveyIndex + 1}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {survey.questions?.length || 0} câu hỏi
                              {survey.description && ` • ${survey.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={e => {
                              e.stopPropagation();
                              onEditSurvey(survey);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteSurvey(survey);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>



                        </div>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="p-6">
                      {survey.questions && survey.questions.length > 0 ? (
                        <div className="space-y-4">
                          {survey.questions.map((question, questionIndex) => (
                            <div
                              key={question.id || questionIndex}
                              className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                                  <HelpCircle className="text-blue-600" size={16} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                      Câu {questionIndex + 1}
                                    </span>
                                    {question.type && (
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                        {question.type}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-medium text-gray-800 mb-3">
                                    {question.questionText || question.text || `Câu hỏi ${questionIndex + 1}`}
                                  </h4>

                                  {/* Question Options */}
                                  {question.options && question.options.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-gray-600 mb-2">Các lựa chọn:</p>
                                      <div className="grid gap-2">
                                        {question.options.map((option, optionIndex) => (
                                          <div
                                            key={option.id || optionIndex}
                                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">
                                                {String.fromCharCode(65 + optionIndex)}
                                              </span>
                                              <span className="text-gray-700">
                                                {option.content || option.text || `Lựa chọn ${optionIndex + 1}`}
                                              </span>
                                            </div>
                                            {(option.score !== undefined && option.score !== null) && (
                                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                {option.score} điểm
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Question without options */}
                                  {(!question.options || question.options.length === 0) && (
                                    <div className="text-sm text-gray-500 italic bg-yellow-50 p-2 rounded border border-yellow-200">
                                      Câu hỏi dạng tự luận hoặc chưa có lựa chọn
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <HelpCircle size={48} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium mb-1">Chưa có câu hỏi nào</p>
                          <p className="text-sm">Thêm câu hỏi để hoàn thiện bài khảo sát này</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalCreateSurvey({ surveyData, setSurveyData, onCancel, onSubmit }) {
  const handleQuestionChange = (idx, field, value) => {
    const updatedQuestions = surveyData.questions.map((q, i) =>
      i === idx ? { ...q, [field]: value } : q
    );
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIdx, optIdx, field, value) => {
    const updatedQuestions = surveyData.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOptions = q.options.map((opt, j) =>
        j === optIdx ? { ...opt, [field]: value } : opt
      );
      return { ...q, options: updatedOptions };
    });
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setSurveyData({
      ...surveyData,
      questions: [
        ...surveyData.questions,
        { questionText: '', options: [{ content: '', score: 0 }] }
      ]
    });
  };

  const addOption = (qIdx) => {
    const updatedQuestions = surveyData.questions.map((q, i) =>
      i === qIdx
        ? { ...q, options: [...q.options, { content: '', score: 0 }] }
        : q
    );
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const removeQuestion = (qIdx) => {
    const updatedQuestions = surveyData.questions.filter((_, i) => i !== qIdx);
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const removeOption = (qIdx, optIdx) => {
    const updatedQuestions = surveyData.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOptions = q.options.filter((_, j) => j !== optIdx);
      return { ...q, options: updatedOptions };
    });
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <FileText size={28} />
            <div>
              <h2 className="text-2xl font-bold">Tạo khảo sát mới</h2>
              <p className="text-blue-100 text-sm mt-1">
                Tạo bài khảo sát để thu thập phản hồi từ người dùng
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Survey Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề khảo sát
            </label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nhập tiêu đề cho bài khảo sát của bạn..."
              value={surveyData.title}
              onChange={e => setSurveyData({ ...surveyData, title: e.target.value })}
            />
          </div>

          {/* Questions Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Câu hỏi khảo sát</h3>
              <span className="text-sm text-gray-500">
                {surveyData.questions.length} câu hỏi
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {surveyData.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <HelpCircle className="text-blue-600" size={20} />
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        Câu hỏi {qIdx + 1}
                      </span>
                    </div>
                    {surveyData.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIdx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Question Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Nhập nội dung câu hỏi ${qIdx + 1}...`}
                      value={q.questionText}
                      onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    />
                  </div>

                  {/* Options Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Các lựa chọn trả lời
                      </label>
                      <span className="text-xs text-gray-500">
                        {q.options.length} lựa chọn
                      </span>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3 mb-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Nhập nội dung lựa chọn..."
                            value={opt.content}
                            onChange={e => handleOptionChange(qIdx, optIdx, 'content', e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="0"
                              value={opt.score}
                              onChange={e => handleOptionChange(qIdx, optIdx, 'score', Number(e.target.value))}
                            />
                            <span className="text-xs text-gray-500">điểm</span>
                          </div>
                          {q.options.length > 1 && (
                            <button
                              onClick={() => removeOption(qIdx, optIdx)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Option Button */}
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                      onClick={() => addOption(qIdx)}
                    >
                      <Plus size={16} />
                      Thêm lựa chọn
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <button
              type="button"
              className="w-full mt-6 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              onClick={addQuestion}
            >
              <Plus size={20} />
              <span className="font-medium">Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg transform hover:scale-105"
          >
            Tạo khảo sát
          </button>
        </div>
      </div>
    </div>
  );
}
function ModalEditSurvey({ title, surveyData, setSurveyData, onCancel, onSubmit, submitLabel }) {
  // Thêm các hàm xử lý giống ModalCreateSurvey
  const handleQuestionChange = (idx, field, value) => {
    const updatedQuestions = surveyData.questions.map((q, i) =>
      i === idx ? { ...q, [field]: value } : q
    );
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIdx, optIdx, field, value) => {
    const updatedQuestions = surveyData.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOptions = q.options.map((opt, j) =>
        j === optIdx ? { ...opt, [field]: value } : opt
      );
      return { ...q, options: updatedOptions };
    });
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setSurveyData({
      ...surveyData,
      questions: [
        ...surveyData.questions,
        { questionText: '', options: [{ content: '', score: 0 }] }
      ]
    });
  };

  const addOption = (qIdx) => {
    const updatedQuestions = surveyData.questions.map((q, i) =>
      i === qIdx
        ? { ...q, options: [...q.options, { content: '', score: 0 }] }
        : q
    );
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const removeQuestion = (qIdx) => {
    const updatedQuestions = surveyData.questions.filter((_, i) => i !== qIdx);
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  const removeOption = (qIdx, optIdx) => {
    const updatedQuestions = surveyData.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOptions = q.options.filter((_, j) => j !== optIdx);
      return { ...q, options: updatedOptions };
    });
    setSurveyData({ ...surveyData, questions: updatedQuestions });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <FileText size={28} />
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-blue-100 text-sm mt-1">
                Chỉnh sửa nội dung khảo sát
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Survey Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề khảo sát
            </label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nhập tiêu đề cho bài khảo sát của bạn..."
              value={surveyData.title}
              onChange={e => setSurveyData({ ...surveyData, title: e.target.value })}
            />
          </div>

          {/* Questions Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Câu hỏi khảo sát</h3>
              <span className="text-sm text-gray-500">
                {surveyData.questions.length} câu hỏi
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {surveyData.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <HelpCircle className="text-blue-600" size={20} />
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        Câu hỏi {qIdx + 1}
                      </span>
                    </div>
                    {surveyData.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIdx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Question Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Nhập nội dung câu hỏi ${qIdx + 1}...`}
                      value={q.questionText}
                      onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    />
                  </div>

                  {/* Options Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Các lựa chọn trả lời
                      </label>
                      <span className="text-xs text-gray-500">
                        {q.options.length} lựa chọn
                      </span>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3 mb-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Nhập nội dung lựa chọn..."
                            value={opt.content}
                            onChange={e => handleOptionChange(qIdx, optIdx, 'content', e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="0"
                              value={opt.score}
                              onChange={e => handleOptionChange(qIdx, optIdx, 'score', Number(e.target.value))}
                            />
                            <span className="text-xs text-gray-500">điểm</span>
                          </div>
                          {q.options.length > 1 && (
                            <button
                              onClick={() => removeOption(qIdx, optIdx)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Option Button */}
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                      onClick={() => addOption(qIdx)}
                    >
                      <Plus size={16} />
                      Thêm lựa chọn
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <button
              type="button"
              className="w-full mt-6 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              onClick={addQuestion}
            >
              <Plus size={20} />
              <span className="font-medium">Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg transform hover:scale-105"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
function ModalConfirmDeleteSurvey({ survey, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xoá khảo sát</h2>
        <p className="mb-6">
          Bạn có chắc muốn xoá khảo sát <span className="font-semibold">{survey.title}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}


export default StaffEvent;
