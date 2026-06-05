import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetPollsBYUserIDQuery,
  useDeletePollByNameMutation, // import the delete mutation
} from "../../Redux/Slices/Cp.ts";
import Toaster from "../../Helper/Toaster.jsx";

const UserPolls = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useGetPollsBYUserIDQuery();
  const [deletePollByName] = useDeletePollByNameMutation();
    const [toasterState, setToasterState] = useState({
    isOpen: false,
    message: "",
    type: "success", // can be either "success" or "error"
  });

const showToastMessage = (message, type = "success") => {
  if (type !== "success" && type !== "error") {
    type = "success"; // fallback
  }
  setToasterState({ isOpen: true, message, type });
  setTimeout(() => setToasterState((prev) => ({ ...prev, isOpen: false })), 7000);
};
  useEffect(() => {
    const user = localStorage.getItem("authToken");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  const polls = Array.isArray(data?.data) ? data.data : [];

const handleDelete = async (pollName, pollid) => {
  const confirmDelete = window.confirm(`Are you sure you want to delete "${pollName}"?`);
  if (!confirmDelete) return;

  try {
    var response = await deletePollByName({ a: pollid });
    console.log(response);
    if ('data' in response) {
      showToastMessage("Poll deleted successfully!", "success");
      refetch();
    } else if ('error' in response) {
      showToastMessage(response.error?.data?.message || response.error.message || "Delete failed", "error");
      refetch();
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    showToastMessage("An unexpected error occurred", "error");
  }
};

  return (
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        padding: "2rem 1rem",
        boxSizing: "border-box",
      }}
    >
           <Toaster
                                  isOpen={toasterState.isOpen}
                                  message={toasterState.message}
                                  type={toasterState.type}
                                  onClose={() => setToasterState({ ...toasterState, isOpen: false })}
                                />
      <div
        style={{
          maxWidth: "none",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
            color: "#000",
          }}
        >
          My Created Polls
        </h1>

        {isLoading || isFetching ? (
          <div style={{ textAlign: "center", color: "#555" }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "red" }}>
            Failed to load polls.
          </div>
        ) : polls.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888" }}>
            You haven't created any polls yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {polls.map((poll) => (
              <div
                key={poll.id}
                style={{
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff")
                }
              >
                <div onClick={() => navigate(`/polldetails/${poll.id}`)} style={{ cursor: "pointer" }}>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      margin: 0,
                      color: "#000",
                    }}
                  >
                    {poll.question}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#555",
                      marginTop: "0.5rem",
                    }}
                  >
                    Total Votes:{" "}
                    <span style={{ fontWeight: "500" }}>{poll.totalVote}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(poll.question,poll.id)} // pass name, not id
                  style={{
                    backgroundColor: "red",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPolls;
