import React, { useState, useEffect } from "react";
import axios from "axios";
import Classes from "../../components/Classes/Classes";
import CreateClassroom from "../../components/Classroom/CreateClassroom";
import JoinClassroom from "../../components/Classroom/JoinClassroom";
import { useAuth } from "../../context/AuthContext";
import LoadingIndicator from "../../components/LoadingIndicator/LoadingIndicator";
import "./Classroom.css";

function Classroom() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const { isAuthenticated, userData, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClassrooms();
    }
  }, [isAuthenticated]);

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get("/api/classrooms");
      setClassrooms(response.data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    }
  };

  const handleNewClassroom = (newClassroom) => {
    setClassrooms([...classrooms, newClassroom]);
  };

  const handleJoinSuccess = (joinedClassroom) => {
    setClassrooms([...classrooms, joinedClassroom]);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="main-classroom">
      <h1>Classrooms</h1>
      <div className="join-classroom">
        {" "}
        <JoinClassroom onJoinSuccess={handleJoinSuccess} />
      </div>
      <div className="button-container">
        {userData && userData.role === "teacher" && (
          <button onClick={() => setIsModalOpen(true)}>
            + Create New Classroom
          </button>
        )}
      </div>
      {/* Render the classroom data */}
      <Classes classrooms={classrooms} />

      {isModalOpen && (
        <CreateClassroom
          closeModal={() => setIsModalOpen(false)}
          onNewClassroom={handleNewClassroom}
        />
      )}
    </div>
  );
}

export default Classroom;
