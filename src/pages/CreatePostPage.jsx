// CreatePostPage.jsx — full-page creator for feed posts
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ComposerCore from '../components/feed/composer/ComposerCore';

export default function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-8 pb-16 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Create Post</h1>
          <p className="text-sm text-gray-500 font-medium">Share an update with your network</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-1">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 lg:p-8 min-h-[600px] flex flex-col">
          <ComposerCore 
            expanded
            className="flex-1 flex flex-col"
            onPostCreated={(post) => {
              toast.success('Post created successfully!');
              navigate('/feed');
            }}
            onClose={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  );
}
