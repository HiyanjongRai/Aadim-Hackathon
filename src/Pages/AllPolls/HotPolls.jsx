import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPollsQuery } from "../../Redux/Slices/Cp.ts";

const HotPolls = () => {
  const { data, isLoading } = useGetPollsQuery();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const polls = data?.data ?? [];
const validPolls = polls.filter(x => x.is_valid === true);
  const totalPages = Math.ceil(polls.length / itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [polls]);

  const handleNavigate = (id) => {
    navigate(`/polldetails/${id}`);
  };

  const paginatedPolls = validPolls.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (isLoading)
    return (
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          padding: "2rem",
          textAlign: "center",
          minHeight: "100vh",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "2rem",
        paddingBottom: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "none",
          margin: "0 auto",
          backgroundColor: "black",
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
            color: "white",
          }}
        >
          Hot Polls
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {paginatedPolls.map((poll) => (
            <div
              key={poll.id}
              onClick={() => handleNavigate(poll.id)}
              style={{
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f0f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fff")
              }
            >
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
                <span style={{ fontWeight: "500" ,}}>{poll.totalVote}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ddd",
              borderRadius: "4px",
              border: "none",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: "0.9rem", fontWeight: "500",color:"white" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ddd",
              borderRadius: "4px",
              border: "none",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotPolls;
