import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ReflectionModal from "../Feedback/ReflectionModal";
import "./PublicReflections.css";
import DefaultImage from "../../assets/img/default-image.jpg";
import { faHeart, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../context/AuthContext";

const PublicReflections = ({ classroomId }) => {
  const [publicEntries, setPublicEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    const fetchPublicEntries = async () => {
      if (classroomId) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/reflections/classroom/${classroomId}/public`,
            { withCredentials: true }
          );
          setPublicEntries(
            response.data.map((entry) => ({
              ...entry,
              isLiked: entry.likedBy.includes(userData?._id),
            }))
          );
        } catch (error) {
          console.error("Failed to fetch public entries:", error);
          toast.error("Failed to fetch public entries.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPublicEntries();
  }, [classroomId, userData?._id]);

  if (loading) {
    return <p>Loading reflections...</p>;
  }

  if (publicEntries.length === 0) {
    return <p>No public reflections posted yet.</p>;
  }

  const handleLike = async (id) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reflections/${id}/like`,
        {},
        { withCredentials: true }
      );
      const updatedEntries = publicEntries.map((entry) =>
        entry._id === id
          ? {
              ...entry,
              likes: response.data.likes,
              isLiked: response.data.likedBy.includes(userData?._id),
            }
          : entry
      );
      setPublicEntries(updatedEntries);
    } catch (error) {
      console.error("Failed to toggle like on reflection:", error);
      toast.error("Failed to process like.");
    }
  };

  const openModal = (entry) => {
    setSelectedEntry(entry);
  };

  const closeModal = () => {
    setSelectedEntry(null);
  };

  const handleFeedbackSubmit = (reflectionId) => {
    setPublicEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry._id === reflectionId ? { ...entry, isFeedbackGiven: true } : entry
      )
    );
  };

  return (
    <div className="public-entries">
      {publicEntries.map((entry) => (
        <div
          key={entry._id}
          className="public-entry"
          onClick={() => openModal(entry)}
        >
          <FontAwesomeIcon
            icon={faHeart}
            className={`like-icon ${entry.isLiked ? "liked" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike(entry._id);
            }}
          />
          <FontAwesomeIcon
            icon={faCommentDots}
            className={`feedback-icon ${
              entry.isFeedbackGiven ? "feedback-given" : ""
            }`}
          />
          <span className="like-count">{entry.likes}</span>
          <div className="entry-image">
            <img
              src={
                entry.photo
                  ? `${process.env.REACT_APP_API_URL}/uploads/reflections/${entry.photo}`
                  : DefaultImage
              }
              alt={entry.title}
            />
          </div>
          <h3>{entry.title}</h3>
          <p>{entry.body}</p>
          <p className="author">
            By: {entry.isAnonymous ? "Anonymous" : entry.userId.name}
          </p>
        </div>
      ))}
      {selectedEntry && (
        <ReflectionModal
          entry={selectedEntry}
          onClose={closeModal}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default PublicReflections;
