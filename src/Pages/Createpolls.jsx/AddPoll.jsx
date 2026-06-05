import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePollMutation } from "../../Redux/Slices/Cp.ts"; // Adjust path if needed
import IsLogin from "../../Helper/LoginHook.jsx";
import Toaster from "../../Helper/Toaster.jsx";

const AddPoll = () => {
  const navigate = useNavigate();
  const [createPoll] = useCreatePollMutation();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([""]);
  const [validUpto, setValidUpto] = useState("");
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
    if(IsLogin() == null){
    navigate("/Login", { state: { 
          message: "Please Login first"
        }})
    }
  }, []);
  const [requirements, setRequirements] = useState([
    {
      minimumAge: 18,
      gender: "",
      mustBeVerified: false,
      mustBeNepalCitizen: false,
    },
  ]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, ""]);

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      {
        minimumAge: 18,
        gender: "",
        mustBeVerified: false,
        mustBeNepalCitizen: false,
      },
    ]);
  };

  const handleRequirementChange = (index, field, value) => {
    const updated = [...requirements];
    updated[index][field] = value;
    setRequirements(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      created_at: new Date().toISOString(),
      valid_upto: new Date(validUpto).toISOString(),
      question,
      options,
      requirements: requirements.map((r) => ({
        ...r,
        id: "string", // Remove if backend auto-generates
        pollId: "string", // Remove if backend auto-generates
      })),
    };

    try {
      await createPoll(payload).unwrap();
showToastMessage("Vote successful!", "success");
    
      navigate("/polls");
    } catch (error) {
showToastMessage("Vote successful!", "success");

      console.error("Error:", error);
    }
  };

  return (
    <div
      style={{
        margin: "0rem auto",
        padding: "0",
        backgroundColor: "black",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow:"hidden",
        height:"100vh"
       
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
        maxWidth: "500px",
        margin: "0rem auto",
        padding: "2.5rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow:'hidden'
       
      }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1rem" }}>
        Create New Poll
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Question */}
        <div>
          <label>Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Valid Upto */}
        <div>
          <label>Valid Upto</label>
          <input
            type="datetime-local"
            value={validUpto}
            onChange={(e) => setValidUpto(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Options */}
        <div>
          <label>Options</label>
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              required
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            style={{ color: "#2563EB", background: "none", border: "none", cursor: "pointer" }}
          >
            + Add Option
          </button>
        </div>

        {/* Requirements */}
        <div>
          <label>Requirements</label>
          {requirements.map((req, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "6px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Minimum Age</label>
                <input
                  type="number"
                  value={req.minimumAge}
                  onChange={(e) => handleRequirementChange(idx, "minimumAge", parseInt(e.target.value))}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
                <label>Gender</label>
                <input
                  type="text"
                  value={req.gender}
                  onChange={(e) => handleRequirementChange(idx, "gender", e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              {/* <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={req.mustBeVerified}
                    onChange={(e) =>
                      handleRequirementChange(idx, "mustBeVerified", e.target.checked)
                    }
                  />{" "}
                  Must be verified
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={req.mustBeNepalCitizen}
                    onChange={(e) =>
                      handleRequirementChange(idx, "mustBeNepalCitizen", e.target.checked)
                    }
                  />{" "}
                  Must be Nepal Citizen
                </label>
              </div> */}
            </div>
          ))}

          {/* <button
            type="button"
            onClick={addRequirement}
            style={{ color: "#2563EB", background: "none", border: "none", cursor: "pointer" }}
          >
            + Add Requirement
          </button> */}
        </div>

        {/* Submit */}
        <button
          type="submit"
          style={{
    
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Submit Poll
        </button>
      </form>
      </div>
    </div>
  );
};

export default AddPoll;
