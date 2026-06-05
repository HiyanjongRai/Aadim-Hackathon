import React, { useState, useEffect } from "react";
import { useGetPollsByNameQuery } from "../../Redux/Slices/Cp.ts";
import { useNavigate } from "react-router-dom";

const SearchPolls = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

const { data, isLoading, isFetching } = useGetPollsByNameQuery(searchTerm, {
  skip: searchTerm.trim() === "", // ⛔ Don't fetch when empty
});

  // ✅ Defensive check to avoid "object is not iterable" error
  const polls = Array.isArray(data?.data) ? data.data : [];
const validPolls = polls.filter(x => x.is_valid === true);

  const totalPages = Math.ceil(polls.length / itemsPerPage);

  const paginatedPolls = validPolls.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1); // Reset to first page on new search
  }, [polls]);

  const handleNavigate = (id) => {
    navigate(`/polldetails/${id}`);
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
          Search Polls
        </h1>

        {/* Search Input */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter poll name..."
            style={{
              padding: "0.75rem",
              width: "300px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Loading */}
        {(isLoading || isFetching) && (
          <div style={{ textAlign: "center", color: "#555" }}>Loading...</div>
        )}

        {/* Poll List */}
        {!isLoading && !isFetching && paginatedPolls.length > 0 && (
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
                  <span style={{ fontWeight: "500" }}>{poll.totalVote}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isFetching && paginatedPolls.length > 0 && (
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
            <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
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
        )}

        {/* No results */}
        {!isLoading && !isFetching && polls.length === 0 && searchTerm && (
          <div style={{ textAlign: "center", color: "#888" }}>
            No polls found.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPolls;
