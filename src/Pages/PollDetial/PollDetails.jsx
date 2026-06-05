
import { useNavigate, useParams } from "react-router-dom";
import { useGetPollByIdQuery, useVoteOnPollMutation } from "../../Redux/Slices/Cp.ts"; // Update path as needed
import IsLogin from "../../Helper/LoginHook.jsx";
import Toaster from "../../Helper/Toaster.jsx";
import { useState } from "react";

const PollDetails = () => {
  const { id } = useParams();
  const { data, isLoading, error,refetch  } = useGetPollByIdQuery(id || "");
  const [voteOnPoll, { isLoading: isVoting }] = useVoteOnPollMutation();
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

const navigate = useNavigate();
  const handleVote = async(optionId) => {
    if(IsLogin() == null){
navigate("/Login", { state: { 
      message: "Please Login first"
    }})
    }
    else{
    try {
    var response = await voteOnPoll({ a: optionId });
    console.log(response)
    if ('data' in response) {
      showToastMessage("Vote successful!", "success");
      refetch();
    } else if ('error' in response) {
      showToastMessage(response.error?.data?.message || response.error.message || "Vote failed", "error");
      refetch();
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    showToastMessage("An unexpected error occurred", "error");
  }
  


    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#fff", backgroundColor: "#000", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red", backgroundColor: "#000", minHeight: "100vh" }}>
        Failed to load poll.
      </div>
    );
  }

  const poll = data.data;

  return (
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "2rem",
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
      padding:"2rem",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "bold",
            marginBottom: "2rem",
            textAlign: "center",
            color: "#000",
          }}
        >
          {poll.question}
        </h1>

      <div
  style={{
    display: "grid",
    gridAutoFlow: "column", // items flow in a row (horizontal direction)
    gridAutoColumns: "1fr", // each item takes equal width
    gap: "1rem",
    width: "100%", // make grid full width
  }}
>

        {poll.options?.map((option) => (
  <div
    key={option.id}
    style={{
      display: "flex",
      flexDirection:"column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem",
      border: "1px solid #ccc",
      borderRadius: "6px",
      backgroundColor: "#f9f9f9",
    }}
  >
    <span style={{ flex: 1, fontSize: "1rem", color: "#000" }}>
      {option.text}
    </span>
     <span style={{ flex: 1, fontSize: "1rem", color: "#000" }}>
      Total Vote:{option.count}
    </span>
    <button
      onClick={() => handleVote(option.id)}
      disabled={isVoting}
      style={{
        marginLeft: "1rem",
        padding: "0.5rem 1rem",
    
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        opacity: isVoting ? 0.7 : 1,
      }}
    >
      Vote
    </button>
  </div>
))}

        </div>
      </div>
    </div>
  );
};

export default PollDetails;
