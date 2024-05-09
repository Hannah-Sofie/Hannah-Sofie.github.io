import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Achievements.css";
import { useAuth } from "../../context/AuthContext";
import LoadingIndicator from "../../components/LoadingIndicator/LoadingIndicator";
import CustomButton from "../../components/CustomButton/CustomButton";

const Achievements = () => {
    const { isAuthenticated, userData, loading } = useAuth();  // Adjusted to include isAuthenticated and loading
    const [achievements, setAchievements] = useState([]);
    const [error, setError] = useState('');

    const fetchAchievements = useCallback(async () => {
      if (!isAuthenticated) {
          console.error('User is not authenticated');
          setError('Authentication error. Please log in.');
          return;
      }
  
      try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/achievements`, {
              headers: {
                  Authorization: `Bearer ${userData.token}`,
              },
          });
          setAchievements(response.data);
      } catch (error) {
          console.error("Error fetching achievements:", error.response);
          setError('Failed to fetch achievements. Please try again.');
      }
  }, [isAuthenticated, userData.token]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAchievements();
        }
    }, [isAuthenticated, fetchAchievements]);  // Updated dependencies to include isAuthenticated

    if (loading) {
        return <LoadingIndicator />;
    }

    if (!isAuthenticated) {
        return <div>Please log in to view your achievements.</div>;
    }

    return (
        <div className="achievements-container">
            <section className="main-achievements">
                <div className="container-achievements">
                    {error && <p className="error">{error}</p>}
                    <h1>Your Achievements</h1>
                    {achievements.length > 0 ? (
                        <ul>
                            {achievements.map((achievement, index) => (
                                <li key={index}>
                                    <strong>{achievement.name}</strong> - {achievement.description}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No achievements to display.</p>
                    )}
                    <CustomButton
                        name="Refresh Achievements"
                        onClick={fetchAchievements}
                        backgroundColor="var(--darker-blue)"
                        color="var(--pure-white)"
                        hoverBackgroundColor="transparent"
                        hoverColor="var(--darker-blue)"
                        hoverBorderColor="var(--darker-blue)"
                    />
                </div>
            </section>
        </div>
    );
};

export default Achievements;
