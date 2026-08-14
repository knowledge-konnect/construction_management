import React, { useState, useEffect } from 'react';
import { getProjects } from '../api/projects';

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadProjects() {
            setLoading(true);
            const { data, error } = await getProjects();

            if (error) {
                setError(error.message);
            } else {
                setProjects(data);
            }
            setLoading(false);
        }

        loadProjects();
    }, []);

    if (loading) return <div>Loading projects...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <ul>
            {projects.map(project => <li key={project.id}>{project.name}</li>)}
        </ul>
    );
}

export default ProjectList;
