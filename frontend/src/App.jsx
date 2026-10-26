import { useState, useEffect } from "react";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [message, setMessage] = useState("");

  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);

  // =========================
  // REQUEST TIME / DATE HELPERS
  // =========================

  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();

  // Only 08:00 AM through 04:00 PM is allowed.
  // Times are shown to the user in 12-hour format.
  const allowedTimes = [];
  for (let hour = 8; hour <= 16; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 16 && minute > 0) continue;

      allowedTimes.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }

  const convert24To12 = (time) => {
    if (!time) return "";

    const [hourString, minute] = time.split(":");
    let hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
  };

  const timePartsTo24 = (hour, minute, period) => {
    if (!hour || !minute || !period) return "";

    let h = Number(hour);

    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;

    return `${String(h).padStart(2, "0")}:${minute}`;
  };

  // =========================
  // RESOURCE REQUEST FORM
  // =========================

  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestStartHour, setRequestStartHour] = useState("");
  const [requestStartMinute, setRequestStartMinute] = useState("");
  const [requestStartPeriod, setRequestStartPeriod] = useState("");
  const [requestEndHour, setRequestEndHour] = useState("");
  const [requestEndMinute, setRequestEndMinute] = useState("");
  const [requestEndPeriod, setRequestEndPeriod] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const startTime24 = timePartsTo24(
    requestStartHour,
    requestStartMinute,
    requestStartPeriod
  );

  const endTime24 = timePartsTo24(
    requestEndHour,
    requestEndMinute,
    requestEndPeriod
  );

  let timeError = "";

  if (startTime24 && (startTime24 < "08:00" || startTime24 > "16:00")) {
    timeError = "Error: Start time must be between 8:00 AM and 4:00 PM.";
  }

  if (
    !timeError &&
    endTime24 &&
    (endTime24 < "08:00" || endTime24 > "16:00")
  ) {
    timeError = "Error: End time must be between 8:00 AM and 4:00 PM.";
  }

  if (!timeError && startTime24 && endTime24 && startTime24 >= endTime24) {
    timeError = "Error: End time must be later than start time.";
  }

  const hourOptions = Array.from(
    { length: 12 },
    (_, i) => String(i + 1).padStart(2, "0")
  );

  const minuteOptions = ["00", "15", "30", "45"];
  const periodOptions = ["AM", "PM"];

  // =========================
  // APPROVE / REJECT REQUEST
  // =========================

  const refreshRequests = async () => {
    try {
      const response = await fetch("/api/requests")
      const data = await response.json();

      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (error) {
      console.error("Error refreshing requests:", error);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://inter-dept-resource-sharing-bkw6.vercel.app/api/requests/${requestId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Request approved successfully.");
        await refreshRequests();
      } else {
        alert(data.message || "Unable to approve request.");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Unable to connect to server.");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://inter-dept-resource-sharing-bkw6.vercel.app/api/requests/${requestId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Request rejected successfully.");
        await refreshRequests();
      } else {
        alert(data.message || "Unable to reject request.");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Unable to connect to server.");
    }
  };

  // =========================
  // EVENT HELPERS
  // =========================

  const getEventsArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.events)) return data.events;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;

    return [];
  };

  const isApprovedEvent = (event) => {
    return (
      event?.approved === true ||
      event?.approved === "true" ||
      event?.approved === 1 ||
      event?.approved === "1"
    );
  };

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://inter-dept-resource-sharing-bkw6.vercel.app/api/events",
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );

      const data = await response.json();

      console.log("Events API response:", data);

      if (!response.ok) {
        console.error("Error fetching events:", data);
        setEvents([]);
        return;
      }

      const eventList = getEventsArray(data);

      console.log("Events loaded:", eventList);

      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

  // =========================
  // APPROVE EVENT
  // =========================

  const approveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://inter-dept-resource-sharing-bkw6.vercel.app/api/events/${eventId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Event approved successfully.");

        await loadEvents();
      } else {
        alert(data.message || "Unable to approve event.");
      }
    } catch (error) {
      console.error("Error approving event:", error);
      alert("Unable to connect to server.");
    }
  };

  // =========================
  // INITIAL DATA
  // =========================

  useEffect(() => {
    fetch("https://inter-dept-resource-sharing-bkw6.vercel.app/api/resources")
      .then((response) => response.json())
      .then((data) => {
        setResources(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching resources:", error);
      });

    refreshRequests();
  }, []);

  // =========================
  // LOAD EVENTS AFTER LOGIN
  // =========================

  useEffect(() => {
    if (isLoggedIn) {
      loadEvents();
    }
  }, [isLoggedIn]);

  // =========================
  // RESOURCE REQUEST
  // =========================

  const openRequestForm = (resource) => {
    setSelectedResource(resource);
    setSelectedEvent("");
    setRequestDate("");
    setRequestStartHour("");
    setRequestStartMinute("");
    setRequestStartPeriod("");
    setRequestEndHour("");
    setRequestEndMinute("");
    setRequestEndPeriod("");
    setRequestMessage("");
  };

  const closeRequestForm = () => {
    setSelectedResource(null);
    setSelectedEvent("");
    setRequestDate("");
    setRequestStartHour("");
    setRequestStartMinute("");
    setRequestStartPeriod("");
    setRequestEndHour("");
    setRequestEndMinute("");
    setRequestEndPeriod("");
    setRequestMessage("");
  };

  const submitResourceRequest = async (e) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!token || !currentUser) {
      alert("Please log in again before submitting a request.");
      return;
    }

    if (
      !selectedResource ||
      !selectedEvent ||
      !requestDate ||
      !startTime24 ||
      !endTime24
    ) {
      alert("Please select the event, date, start time and end time.");
      return;
    }

    if (requestDate < todayString) {
      alert("You cannot select a past date.");
      return;
    }

    if (
      !allowedTimes.includes(startTime24) ||
      !allowedTimes.includes(endTime24)
    ) {
      alert("Booking time must be between 08:00 AM and 04:00 PM.");
      return;
    }

    if (startTime24 >= endTime24) {
      alert("End time must be later than start time.");
      return;
    }

    if (!currentUser?.department) {
      alert("Your department information is missing. Please log in again.");
      return;
    }

    const departmentIds = {
      CSE: "6ab41532213dfd3abc50ac3e",
      ECE: "6ab4155b213dfd3abc50ac3f",
      EEE: "6ab4156a213dfd3abc50ac40",
      MECH: "6ab41576213dfd3abc50ac41",
      CIVIL: "6ab415a2213dfd3abc50ac42",
    };

    const requestingDepartment = departmentIds[currentUser.department];

    if (!requestingDepartment) {
      alert("Invalid department.");
      return;
    }

    try {
      const response = await fetch("https://inter-dept-resource-sharing-bkw6.vercel.app/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resource: selectedResource._id,
          event: selectedEvent,
          date: requestDate,
          startTime: startTime24,
          endTime: endTime24,
          requestingDepartment,
          message: requestMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Resource request submitted successfully!");
        await refreshRequests();
        closeRequestForm();
      } else {
        alert(data.message || "Failed to submit request.");
      }
    } catch (error) {
      console.error("Error submitting resource request:", error);
      alert("Unable to connect to server.");
    }
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "https://inter-dept-resource-sharing-bkw6.vercel.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Login successful!");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Load events after token is saved.
        await loadEvents();
        await refreshRequests();

        setIsLoggedIn(true);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setMessage("Unable to connect to server");
    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "https://inter-dept-resource-sharing-bkw6.vercel.app/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            department,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful!");

        setName("");
        setEmail("");
        setPassword("");
        setDepartment("");
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      setMessage("Unable to connect to server");
    }
  };

  // =========================
  // SWITCH PAGE
  // =========================

  const switchPage = () => {
    setIsRegister(!isRegister);

    setName("");
    setEmail("");
    setPassword("");
    setDepartment("");

    setMessage("");
  };

  if (isLoggedIn) {
    // =========================
    // ADMIN EVENT APPROVAL PAGE
    // =========================

    if (currentPage === "admin-events") {
      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (currentUser?.role !== "admin") {
        setCurrentPage("dashboard");
        return null;
      }

      return (
        <div className="dashboard">
          <nav className="dashboard-navbar">
            <div className="dashboard-brand">
              <div className="dashboard-logo">IR</div>

              <div>
                <h2>InterResource</h2>
                <span>Campus Resource Platform</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => setCurrentPage("dashboard")}
            >
              ← Dashboard
            </button>
          </nav>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <p>ADMIN</p>

              <h1>Event Approval</h1>

              <span>
                Review and approve campus events before they are visible
                to users.
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{ marginTop: "25px" }}
            >
              <h3>All Events</h3>

              {events.map((event) => (
                <div
                  className="activity"
                  key={event._id}
                >
                  <div>📅</div>

                  <div style={{ flex: 1 }}>
                    <strong>{event.name}</strong>

                    <span>
                      {event.date
                        ? new Date(event.date).toLocaleDateString()
                        : "Date not available"}
                      {" • "}
                      {event.startTime} - {event.endTime}
                      {" • "}
                      {event.location}
                    </span>

                    <span>
                      Department:{" "}
                      {event.department?.name || "Department"}
                    </span>
                  </div>

                  <div>
                    {isApprovedEvent(event) ? (
                      <div
                        style={{
                          color: "#16a34a",
                          fontWeight: "600",
                          fontSize: "11px",
                        }}
                      >
                        ● Approved
                      </div>
                    ) : (
                      <button
                        onClick={() => approveEvent(event._id)}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "7px",
                          padding: "7px 12px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <p
                  style={{
                    color: "#55718a",
                    fontSize: "13px",
                  }}
                >
                  No events found.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // =========================
    // EVENTS PAGE
    // =========================

    if (currentPage === "events") {
      return (
        <div className="dashboard">
          <nav className="dashboard-navbar">
            <div className="dashboard-brand">
              <div className="dashboard-logo">IR</div>

              <div>
                <h2>InterResource</h2>
                <span>Campus Resource Platform</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => setCurrentPage("dashboard")}
            >
              ← Dashboard
            </button>
          </nav>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <p>Events</p>

              <h1>Campus Events</h1>

              <span>
                View events created by different departments.
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{ marginTop: "25px" }}
            >
              <h3>Upcoming Events</h3>

              {events
                .filter((event) => isApprovedEvent(event))
                .map((event) => (
                  <div
                    className="activity"
                    key={event._id}
                  >
                    <div>📅</div>

                    <div>
                      <strong>{event.name}</strong>

                      <span>
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "Date not available"}
                        {" • "}
                        {event.startTime} - {event.endTime}
                        {" • "}
                        {event.location}
                      </span>
                    </div>
                  </div>
                ))}

              {events.filter(
                (event) => isApprovedEvent(event)
              ).length === 0 && (
                <p
                  style={{
                    color: "#55718a",
                    fontSize: "13px",
                  }}
                >
                  No approved events available.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // =========================
    // BOOKINGS PAGE
    // =========================

    if (currentPage === "bookings") {
      return (
        <div className="dashboard">
          <nav className="dashboard-navbar">
            <div className="dashboard-brand">
              <div className="dashboard-logo">IR</div>

              <div>
                <h2>InterResource</h2>
                <span>Campus Resource Platform</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => setCurrentPage("dashboard")}
            >
              ← Dashboard
            </button>
          </nav>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <p>BOOKINGS</p>

              <h1>My Bookings</h1>

              <span>
                View and manage your confirmed resource bookings.
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{ marginTop: "25px" }}
            >
              <h3>Confirmed Bookings</h3>

              <p
                style={{
                  color: "#55718a",
                  fontSize: "13px",
                }}
              >
                No bookings to display yet.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // =========================
    // REQUESTS PAGE
    // =========================

    if (currentPage === "requests") {
      const currentUser = JSON.parse(
        localStorage.getItem("user")
      );

      return (
        <div className="dashboard">
          <nav className="dashboard-navbar">
            <div className="dashboard-brand">
              <div className="dashboard-logo">IR</div>

              <div>
                <h2>InterResource</h2>
                <span>Campus Resource Platform</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => setCurrentPage("dashboard")}
            >
              ← Dashboard
            </button>
          </nav>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <p>Requests</p>

              <h1>Resource Requests</h1>

              <span>
                Track resource requests between departments.
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{ marginTop: "25px" }}
            >
              <h3>My Requests</h3>

              {(() => {
                const visibleRequests =
                  currentUser?.role === "admin"
                    ? requests
                    : requests.filter((request) => {
                        const requestUserId =
                          request.user?._id ||
                          request.user?.id ||
                          request.user;

                        const requestUserEmail =
                          request.user?.email;

                        return (
                          String(requestUserId) ===
                            String(currentUser?.id) ||
                          requestUserEmail ===
                            currentUser?.email
                        );
                      });

                return (
                  <>
                    {visibleRequests.map((request) => (
                      <div
                        className="activity"
                        key={request._id}
                      >
                        <div>📋</div>

                        <div style={{ flex: 1 }}>
                          <strong>
                            {request.resource?.name ||
                              "Resource Request"}
                          </strong>

                          <span>
                            Requested by:{" "}
                            {request.user?.name ||
                              "Unknown User"}
                            {request.user?.email
                              ? ` • ${request.user.email}`
                              : ""}
                          </span>

                          <span>
                            Event:{" "}
                            {request.event?.name || "Event"}
                            {" • "}
                            Department:{" "}
                            {request.requestingDepartment
                              ?.name ||
                              request.user?.department ||
                              "Department"}
                          </span>

                          <span>
                            Date:{" "}
                            {request.date
                              ? new Date(
                                  request.date
                                ).toLocaleDateString()
                              : "Date not available"}
                            {" • "}
                            Time:{" "}
                            {request.startTime
                              ? convert24To12(
                                  request.startTime
                                )
                              : ""}
                            {request.endTime
                              ? ` - ${convert24To12(
                                  request.endTime
                                )}`
                              : ""}
                          </span>

                          <span>
                            Location:{" "}
                            {request.resource?.location ||
                              "Not available"}
                          </span>

                          {request.message && (
                            <span>
                              Message: {request.message}
                            </span>
                          )}
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                request.status ===
                                "approved"
                                  ? "#16a34a"
                                  : request.status ===
                                    "rejected"
                                  ? "#dc2626"
                                  : "#d97706",
                              fontWeight: "600",
                              fontSize: "11px",
                              marginBottom: "8px",
                            }}
                          >
                            ● {request.status}
                          </div>

                          {request.status === "pending" &&
                            currentUser?.role ===
                              "admin" && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    approveRequest(
                                      request._id
                                    )
                                  }
                                  style={{
                                    background:
                                      "#16a34a",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding:
                                      "6px 10px",
                                    cursor:
                                      "pointer",
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    rejectRequest(
                                      request._id
                                    )
                                  }
                                  style={{
                                    background:
                                      "#dc2626",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding:
                                      "6px 10px",
                                    cursor:
                                      "pointer",
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}

                    {visibleRequests.length === 0 && (
                      <p
                        style={{
                          color: "#55718a",
                          fontSize: "13px",
                        }}
                      >
                        No resource requests found.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      );
    }

    // =========================
    // RESOURCES PAGE
    // =========================

    if (currentPage === "resources") {
      return (
        <div className="dashboard">
          <nav className="dashboard-navbar">
            <div className="dashboard-brand">
              <div className="dashboard-logo">IR</div>

              <div>
                <h2>InterResource</h2>
                <span>Campus Resource Platform</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => setCurrentPage("dashboard")}
            >
              ← Dashboard
            </button>
          </nav>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <p>Resources</p>

              <h1>Campus Resources</h1>

              <span>
                View and manage resources shared between departments.
              </span>
            </div>

            <div className="dashboard-cards">
              <div className="dashboard-card">
                <div className="card-icon">🏫</div>

                <div>
                  <strong>
                    {String(resources.length).padStart(2, "0")}
                  </strong>

                  <span>Total Resources</span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">🟢</div>

                <div>
                  <strong>
                    {String(
                      resources.filter(
                        (resource) => resource.available
                      ).length
                    ).padStart(2, "0")}
                  </strong>

                  <span>Available</span>
                </div>
              </div>
            </div>

            <div
              className="dashboard-panel"
              style={{ marginTop: "25px" }}
            >
              <h3>Available Resources</h3>

              {resources.map((resource) => (
                <div
                  className="activity"
                  key={resource._id}
                >
                  <div>
                    {resource.type === "Equipment"
                      ? "📽️"
                      : resource.type === "Laboratory"
                      ? "💻"
                      : "🏛️"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{resource.name}</strong>

                    <span>
                      {resource.department?.name ||
                        "Department"}{" "}
                      • {resource.location}

                      {resource.capacity
                        ? ` • Capacity: ${resource.capacity}`
                        : ` • ${resource.type}`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        color: resource.available
                          ? "#16a34a"
                          : "#dc2626",
                        fontWeight: "600",
                        fontSize: "11px",
                      }}
                    >
                      {resource.available
                        ? "● Available"
                        : "● Not Available"}
                    </div>

                    {resource.available && (
                      <button
                        onClick={() =>
                          openRequestForm(resource)
                        }
                        style={{
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "7px",
                          padding: "7px 12px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        Request Resource
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {resources.length === 0 && (
                <p
                  style={{
                    color: "#55718a",
                    fontSize: "13px",
                  }}
                >
                  No resources found.
                </p>
              )}

              {selectedResource && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "520px",
                      background: "white",
                      borderRadius: "14px",
                      padding: "25px",
                      boxSizing: "border-box",
                      boxShadow:
                        "0 20px 50px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0 }}>
                          Request Resource
                        </h3>

                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "#55718a",
                            fontSize: "13px",
                          }}
                        >
                          {selectedResource.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={closeRequestForm}
                        style={{
                          border: "none",
                          background: "transparent",
                          fontSize: "22px",
                          cursor: "pointer",
                          color: "#64748b",
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <form
                      onSubmit={submitResourceRequest}
                      style={{ marginTop: "20px" }}
                    >
                      <label
                        style={{
                          display: "block",
                          marginBottom: "7px",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Event
                      </label>

                      {/* =========================
                          APPROVED EVENT DROPDOWN
                      ========================= */}

                      <select
                        value={selectedEvent}
                        onChange={(e) =>
                          setSelectedEvent(e.target.value)
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "11px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "white",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="">
                          Select event
                        </option>
                        {Array.from(
                      new Map(
                       events
                        .filter(
                            (event) =>
                            event?._id &&
                            event?.name
                          )
                        .map((event) => [
                        event.name,
                         event,
                        ])
                        ).values()
                      ).map((event) => (
                    <option
                  key={event._id}
                  value={event._id}
                >
                {event.name}
                </option>
              ))}
                  </select>
                      <label
                        style={{
                          display: "block",
                          margin: "16px 0 7px",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Request Date
                      </label>

                      <input
                        type="date"
                        value={requestDate}
                        min={todayString}
                        onChange={(e) =>
                          setRequestDate(e.target.value)
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "11px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                        }}
                      />

                      <div
                        style={{
                          marginTop: "8px",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Today or a future date to be selected.
                      </div>

                      <div style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
                                fontSize: "13px",
                              }}
                            >
                              Start Time
                            </label>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "1fr 1fr 1fr",
                                gap: "6px",
                              }}
                            >
                              <select
                                value={requestStartHour}
                                onChange={(e) =>
                                  setRequestStartHour(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  Hour
                                </option>

                                {hourOptions.map(
                                  (hour) => (
                                    <option
                                      key={`start-hour-${hour}`}
                                      value={hour}
                                    >
                                      {hour}
                                    </option>
                                  )
                                )}
                              </select>

                              <select
                                value={requestStartMinute}
                                onChange={(e) =>
                                  setRequestStartMinute(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  Min
                                </option>

                                {minuteOptions.map(
                                  (minute) => (
                                    <option
                                      key={`start-minute-${minute}`}
                                      value={minute}
                                    >
                                      {minute}
                                    </option>
                                  )
                                )}
                              </select>

                              <select
                                value={requestStartPeriod}
                                onChange={(e) =>
                                  setRequestStartPeriod(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  AM/PM
                                </option>

                                {periodOptions.map(
                                  (period) => (
                                    <option
                                      key={`start-period-${period}`}
                                      value={period}
                                    >
                                      {period}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
                                fontSize: "13px",
                              }}
                            >
                              End Time
                            </label>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "1fr 1fr 1fr",
                                gap: "6px",
                              }}
                            >
                              <select
                                value={requestEndHour}
                                onChange={(e) =>
                                  setRequestEndHour(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  Hour
                                </option>

                                {hourOptions.map(
                                  (hour) => (
                                    <option
                                      key={`end-hour-${hour}`}
                                      value={hour}
                                    >
                                      {hour}
                                    </option>
                                  )
                                )}
                              </select>

                              <select
                                value={requestEndMinute}
                                onChange={(e) =>
                                  setRequestEndMinute(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  Min
                                </option>

                                {minuteOptions.map(
                                  (minute) => (
                                    <option
                                      key={`end-minute-${minute}`}
                                      value={minute}
                                    >
                                      {minute}
                                    </option>
                                  )
                                )}
                              </select>

                              <select
                                value={requestEndPeriod}
                                onChange={(e) =>
                                  setRequestEndPeriod(
                                    e.target.value
                                  )
                                }
                                required
                                style={{
                                  width: "100%",
                                  padding: "11px 6px",
                                  borderRadius: "8px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background: "white",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="">
                                  AM/PM
                                </option>

                                {periodOptions.map(
                                  (period) => (
                                    <option
                                      key={`end-period-${period}`}
                                      value={period}
                                    >
                                      {period}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p
                        style={{
                          margin: "9px 0 0",
                          color: "#dc2626",
                          fontSize: "11px",
                          fontWeight: "600",
                          lineHeight: "1.5",
                        }}
                      >
                        Booking time: 8.00 AM - 4.00 PM
                      </p>

                      {timeError && (
                        <p
                          style={{
                            margin: "7px 0 0",
                            color: "#dc2626",
                            fontSize: "12px",
                            fontWeight: "700",
                          }}
                        >
                          {timeError}
                        </p>
                      )}

                      <label
                        style={{
                          display: "block",
                          margin: "16px 0 7px",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Message
                      </label>

                      <textarea
                        value={requestMessage}
                        onChange={(e) =>
                          setRequestMessage(
                            e.target.value
                          )
                        }
                        placeholder="Why do you need this resource?"
                        rows="4"
                        style={{
                          width: "100%",
                          padding: "11px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "10px",
                          marginTop: "18px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={closeRequestForm}
                          style={{
                            padding: "9px 15px",
                            borderRadius: "7px",
                            border:
                              "1px solid #cbd5e1",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={!!timeError}
                          style={{
                            padding: "9px 15px",
                            borderRadius: "7px",
                            border: "none",
                            background: timeError
                              ? "#94a3b8"
                              : "#2563eb",
                            color: "white",
                            cursor: timeError
                              ? "not-allowed"
                              : "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Send Request
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // =========================
    // DASHBOARD
    // =========================

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    return (
      <div className="dashboard">
        <nav className="dashboard-navbar">
          <div className="dashboard-brand">
            <div className="dashboard-logo">IR</div>

            <div>
              <h2>InterResource</h2>
              <span>Campus Resource Platform</span>
            </div>
          </div>

          <div className="dashboard-user">
            <div className="user-info">
              <strong>{user?.name || "User"}</strong>

              <span>
                {user?.department || "Department"}
              </span>
            </div>

            <button
              className="logout-button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setIsLoggedIn(false);
                setIsRegister(false);
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <p>Dashboard</p>

            <h1>
              Welcome back, {user?.name || "User"} 👋
            </h1>

            <span>
              Manage campus resources, events and requests
              from one place.
            </span>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon">🏫</div>

              <div>
                <strong>05</strong>
                <span>Departments</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📦</div>

              <div>
                <strong>03</strong>
                <span>Resources</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📅</div>

              <div>
                <strong>01</strong>
                <span>Events</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📩</div>

              <div>
                <strong>01</strong>
                <span>Requests</span>
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-panel">
              <h3>Quick Actions</h3>

              <div className="quick-actions">
                <button
                  onClick={() =>
                    setCurrentPage("resources")
                  }
                >
                  📦
                  <span>View Resources</span>
                </button>

                <button
                  onClick={() =>
                    setCurrentPage("events")
                  }
                >
                  📅
                  <span>View Events</span>
                </button>

                <button
                  onClick={() =>
                    setCurrentPage("requests")
                  }
                >
                  📋
                  <span>My Requests</span>
                </button>

                <button
                  onClick={() =>
                    setCurrentPage("bookings")
                  }
                >
                  📋
                  <span>My Bookings</span>
                </button>
              </div>
            </div>

            <div className="dashboard-panel">
              <h3>Recent Activity</h3>

              <div className="activity">
                <div>📅</div>

                <div>
                  <strong>Tech Workshop</strong>

                  <span>
                    Event scheduled for September 30
                  </span>
                </div>
              </div>

              <div className="activity">
                <div>📩</div>

                <div>
                  <strong>Resource Request</strong>

                  <span>
                    ECE Seminar Hall request approved
                  </span>
                </div>
              </div>

              <div className="activity">
                <div>📋</div>

                <div>
                  <strong>Booking Confirmed</strong>

                  <span>
                    Seminar Hall booked for Tech Workshop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* =========================
          MOVING BUBBLES
      ========================= */}

      <div className="circle circle1"></div>
      <div className="circle circle2"></div>
      <div className="circle circle3"></div>

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">
        <div className="brand">
          <div className="logo">IR</div>

          <div>
            <h3>InterResource</h3>

            <span>
              Campus Resource Platform
            </span>
          </div>
        </div>

        <div className="nav-right">
          <span>About</span>
          <span>Features</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">
        {/* =========================
            LEFT HERO
        ========================= */}

        <section className="hero">
          <div className="badge">
            ✦ Smart Campus Resource Management
          </div>

          <h1>
            Connect.
            <br />
            <span>Share.</span>
            <br />
            Collaborate.
          </h1>

          <p>
            A centralized platform for departments
            to manage, discover and share campus
            resources efficiently.
          </p>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                🏫
              </div>

              <div>
                <strong>
                  Shared Resources
                </strong>

                <small>
                  Find classrooms, labs & equipment
                </small>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                📅
              </div>

              <div>
                <strong>
                  Event Planning
                </strong>

                <small>
                  Organize events with ease
                </small>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                🔗
              </div>

              <div>
                <strong>
                  Inter-Department
                </strong>

                <small>
                  Connect departments on one platform
                </small>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            LOGIN / REGISTER
        ========================= */}

        <section className="login-wrapper">
          <div className="login-card">
            {isRegister ? (
              <>
                <div className="welcome-icon">
                  📝
                </div>

                <h2>
                  Create Account
                </h2>

                <p className="login-subtitle">
                  Register to access your campus workspace
                </p>

                <form onSubmit={handleRegister}>
                  <label>
                    Full Name
                  </label>

                  <div className="input-box">
                    <span>👤</span>

                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      required
                    />
                  </div>

                  <label>
                    Email Address
                  </label>

                  <div className="input-box">
                    <span>✉</span>

                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <label>
                    Password
                  </label>

                  <div className="input-box">
                    <span>🔒</span>

                    <input
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                    />
                  </div>

                  <label>
                    Department
                  </label>

                  <div className="input-box">
                    <span>🏫</span>

                    <select
                      value={department}
                      onChange={(e) =>
                        setDepartment(e.target.value)
                      }
                      required
                    >
                      <option value="">
                        Select Department
                      </option>

                      <option value="CSE">
                        Computer Science & Engineering
                      </option>

                      <option value="ECE">
                        Electronics & Communication
                      </option>

                      <option value="EEE">
                        Electrical & Electronics
                      </option>

                      <option value="MECH">
                        Mechanical Engineering
                      </option>

                      <option value="CIVIL">
                        Civil Engineering
                      </option>
                    </select>
                  </div>

                  <button
                    className="login-button"
                    type="submit"
                  >
                    Create Account

                    <span>→</span>
                  </button>
                </form>

                {message && (
                  <div
                    className={
                      message ===
                      "Registration successful!"
                        ? "success-message"
                        : "error-message"
                    }
                  >
                    {message}
                  </div>
                )}

                <div className="divider">
                  <span></span>

                  <p>
                    Secure Campus Registration
                  </p>

                  <span></span>
                </div>

                <p className="security">
                  🔐 Your account information is securely protected
                </p>

                <p className="switch-text">
                  Already have an account?

                  <button
                    type="button"
                    onClick={switchPage}
                  >
                    Sign In
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="welcome-icon">
                  👋
                </div>

                <h2>
                  Welcome Back
                </h2>

                <p className="login-subtitle">
                  Sign in to access your campus workspace
                </p>

                <form onSubmit={handleLogin}>
                  <label>
                    Email Address
                  </label>

                  <div className="input-box">
                    <span>✉</span>

                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <label>
                    Password
                  </label>

                  <div className="input-box">
                    <span>🔒</span>

                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="login-options">
                    <label className="remember">
                      <input type="checkbox" />
                      Remember me
                    </label>

                    <span className="forgot">
                      Forgot password?
                    </span>
                  </div>

                  <button
                    className="login-button"
                    type="submit"
                  >
                    Sign In

                    <span>→</span>
                  </button>
                </form>

                {message && (
                  <div
                    className={
                      message === "Login successful!"
                        ? "success-message"
                        : "error-message"
                    }
                  >
                    {message}
                  </div>
                )}

                <div className="divider">
                  <span></span>

                  <p>
                    Secure Campus Access
                  </p>

                  <span></span>
                </div>

                <p className="security">
                  🔐 Your account information is securely protected
                </p>

                <p className="switch-text">
                  Don't have an account?

                  <button
                    type="button"
                    onClick={switchPage}
                  >
                    Create Account
                  </button>
                </p>
              </>
            )}
          </div>
        </section>
      </main>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="stats">
        <div>
          <strong>05+</strong>

          <span>
            Departments
          </span>
        </div>

        <div>
          <strong>24/7</strong>

          <span>
            Resource Access
          </span>
        </div>

        <div>
          <strong>100%</strong>

          <span>
            Centralized
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;