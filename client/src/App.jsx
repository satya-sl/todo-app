import { useEffect, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const LIMIT = 5;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState(null);

  const editRef = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [filter, page]);

  // Click outside to exit edit mode
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingId && editRef.current && !editRef.current.contains(e.target)) {
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://todo-app-2fdq.onrender.com/tasks", {
        params: { filter, page },
      });
      setTasks(res.data.tasks);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      await axios.post("http://localhost:3000/tasks", {
        title,
        dueDate: dueDate || null,
      });
      setTitle("");
      setDueDate(null);
      fetchTasks();
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      await axios.patch(`http://localhost:3000/tasks/${id}`, updates);
      fetchTasks();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : null);
  };

  const handleSave = async (id) => {
    await updateTask(id, {
      title: editTitle,
      dueDate: editDueDate || null,
    });
    setEditingId(null);
  };

  const renderFilters = () => (
    <div className="flex gap-2 my-2">
      {["all", "incomplete", "complete", "today"].map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1 rounded ${
            filter === f ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📝 To-Do App</h1>

      {/* Add Task */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-2 py-1 flex-1 rounded"
        />
        <DatePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          placeholderText="Set due date & time"
          className="border px-2 py-1 rounded w-full"
        />
        <button onClick={addTask} className="bg-green-500 text-white px-3 py-1 rounded">
          Add
        </button>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Task List */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-center text-gray-500">No tasks found for selected filter.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task._id}
              className="border p-2 rounded flex items-start justify-between gap-2 min-h-[66px]"
            >
              {/* Left: Info */}
              <div className="flex items-start gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    updateTask(task._id, { completed: !task.completed })
                  }
                  className="mt-1 accent-green-600"
                />

                {editingId === task._id ? (
                  <div ref={editRef} className="flex flex-col w-full gap-1">
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <DatePicker
                      selected={editDueDate}
                      onChange={(date) => setEditDueDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      placeholderText="Set due date & time"
                      className="border px-2 py-1 rounded w-full"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className={task.completed ? "line-through text-gray-500" : ""}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-sm text-gray-500">
                        Due: {dayjs(task.dueDate).format("MMM D, h:mm A")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 ml-2">
                {editingId === task._id ? (
                  <>
                    <button
                      onClick={() => handleSave(task._id)}
                      className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 px-2 py-1 text-sm rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (

                  <>
                    <button
                      onClick={() => handleEdit(task)}
                      title="Edit"
                      className="text-yellow-600 text-xl"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTask(task._id)}
                      title="Delete"
                      className="text-red-600 text-xl"
                    >
                      ❌
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-3 py-1 rounded ${
            page === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-500 text-white"
          }`}
        >
          ⬅ Prev
        </button>
        <span className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded ${
            page === totalPages ? "bg-gray-300 text-gray-500" : "bg-blue-500 text-white"
          }`}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}

export default App;
