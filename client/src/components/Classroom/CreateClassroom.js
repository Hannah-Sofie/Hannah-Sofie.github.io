import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import "./CreateClassroom.css";

function CreateClassroom({ closeModal, onNewClassroom }) {
  // Initialize state for form data, file, and preview image
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    learningGoals: "",
  });
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files.length > 0) {
      const file = files[0];
      setFile(file);
      // Create a local URL for image preview
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("learningGoals", formData.learningGoals);
    if (file) {
      data.append("photo", file); // Append the file if it exists
    }

    try {
      const response = await axios.post("/api/classrooms/create", data);
      toast.success("Classroom created successfully!");
      onNewClassroom(response.data);
      closeModal(); // Close the modal after successful creation
    } catch (error) {
      toast.error(
        "Failed to create classroom: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="createclassroom-modal">
      <div className="modal-content">
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        <h2>Create Classroom</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Title (e.g. IDG2671 - Webproject)"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <textarea
            name="learningGoals"
            placeholder="Learning Goals"
            value={formData.learningGoals}
            onChange={handleChange}
            required
          />

          <div className="file-upload">
            <label
              htmlFor="classroom-photo-upload"
              className="file-upload-label"
            >
              <FontAwesomeIcon icon={faUpload} /> Upload classroom icon
            </label>
            <input
              id="classroom-photo-upload"
              type="file"
              name="photo"
              onChange={handleChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview of uploaded classroom header"
                className="classroom-photo-preview"
              />
            )}
          </div>

          <button type="submit" className="create-button">
            Create Classroom
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateClassroom;
