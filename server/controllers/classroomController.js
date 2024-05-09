const CreateError = require("../utils/createError");
const Classroom = require("../models/classroomSchema");
const asyncHandler = require("express-async-handler");

const createClassroom = asyncHandler(async (req, res) => {
  const { title, description, learningGoals } = req.body;
  if (!title || !description || !learningGoals) {
    throw new CreateError("Missing required fields", 400);
  }
  const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const photoUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/classrooms/${
        req.file.filename
      }`
    : undefined;
  const classroom = await Classroom.create({
    title,
    description,
    learningGoals,
    classCode,
    photoUrl,
    teacher: req.user._id,
  });
  res.status(201).json(classroom);
});

const joinClassroom = asyncHandler(async (req, res) => {
  const { classCode } = req.body;
  const classroom = await Classroom.findOneAndUpdate(
    { classCode },
    { $addToSet: { students: req.user._id } },
    { new: true }
  ).populate("students", "name email");
  if (!classroom) {
    throw new CreateError("Classroom not found", 404);
  }
  res.status(200).json(classroom);
});

const favouriteClassroom = asyncHandler(async (req, res) => {
  const { classCode } = req.body;
  const classroom = await Classroom.findOneAndUpdate(
    { classCode },
    { $addToSet: { favourites: req.user._id } },
    { new: true }
  ).populate("students", "name email");
  if (!classroom) {
    throw new CreateError("Classroom not found", 404);
  }
  res.status(200).json(classroom);
});

const getClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find({
    $or: [{ teacher: req.user._id }, { students: req.user._id }],
  }).populate("students", "name email");
  res.json(classrooms);
});

const getClassroomById = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id).populate({
    path: "students",
    select: "name email role",
  });
  if (!classroom) {
    throw new CreateError("Classroom not found", 404);
  }
  res.json(classroom);
});

const removeStudent = asyncHandler(async (req, res) => {
  const { classroomId, studentId } = req.params;
  const classroom = await Classroom.findByIdAndUpdate(
    classroomId,
    { $pull: { students: studentId } },
    { new: true }
  ).populate("students", "name email");
  if (!classroom) {
    throw new CreateError("Classroom not found", 404);
  }
  res.status(200).json(classroom);
});

const updateClassroom = asyncHandler(async (req, res) => {
  const { title, description, learningGoals, photoUrl } = req.body;
  const { id } = req.params; // Assuming the classroom ID is passed as a URL parameter

  // Optionally check if the current user is the teacher of this classroom
  const classroom = await Classroom.findById(id);
  if (!classroom) {
    throw new CreateError("Classroom not found", 404);
  }
  if (classroom.teacher.toString() !== req.user._id.toString()) {
    throw new CreateError("Not authorized to edit this classroom", 403);
  }

  const updatedFields = {
    title: title || classroom.title,
    description: description || classroom.description,
    learningGoals: learningGoals || classroom.learningGoals,
    photoUrl: photoUrl || classroom.photoUrl,
  };

  const updatedClassroom = await Classroom.findByIdAndUpdate(
    id,
    updatedFields,
    { new: true }
  );
  res.json(updatedClassroom);
});

module.exports = {
  createClassroom,
  joinClassroom,
  favouriteClassroom,
  getClassrooms,
  getClassroomById,
  removeStudent,
  updateClassroom,
};
