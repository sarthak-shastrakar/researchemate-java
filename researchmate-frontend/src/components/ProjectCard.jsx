// src/components/ProjectCard.jsx
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Calendar, ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <button
      id={`project-card-${project.id}`}
      className="group text-left w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-5 cursor-pointer"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
          )}
          {project.createdAt && (
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
