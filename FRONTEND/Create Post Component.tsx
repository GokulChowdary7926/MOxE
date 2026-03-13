// frontend/src/pages/create/CreatePost.tsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  MapPin, 
  Smile, 
  Tag,
  Lock,
  Globe,
  Users,
  Star
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Components
import ImageCropper from '../../components/common/ImageCropper';
import LocationPicker from '../../components/common/LocationPicker';
import PrivacySelector from '../../components/common/PrivacySelector';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [media, setMedia] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPrivacySelector, setShowPrivacySelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMedia(prev => [...prev, {
          file,
          preview: event.target?.result,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error('Please select at least one image or video');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    media.forEach((item, index) => {
      formData.append(`media`, item.file);
    });
    
    formData.append('caption', caption);
    formData.append('location', location);
    formData.append('privacy', privacy);
    formData.append('tags', JSON.stringify(tags));

    await createPostMutation.mutateAsync(formData);
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Post
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Upload Area */}
        <div className="p-4">
          {media.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Click to select photos or videos
              </p>
              <p className="text-sm text-gray-500">
                You can select up to 10 items
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map((item, index) => (
                <div key={index} className="relative aspect-square">
                  {item.type === 'image' ? (
                    <img
                      src={item.preview}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={item.preview}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {media.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Caption */}
        <div className="p-4 border-t dark:border-gray-700">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-right text-sm text-gray-500 mt-1">
            {caption.length}/2200
          </p>
        </div>

        {/* Options */}
        <div className="p-4 border-t dark:border-gray-700 space-y-3">
          {/* Location */}
          <button
            onClick={() => setShowLocationPicker(true)}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {location || 'Add location'}
              </span>
            </div>
          </button>

          {/* Privacy */}
          <button
            onClick={() => setShowPrivacySelector(true)}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {privacy === 'PUBLIC' && <Globe className="w-5 h-5 text-gray-500" />}
              {privacy === 'FOLLOWERS_ONLY' && <Users className="w-5 h-5 text-gray-500" />}
              {privacy === 'CLOSE_FRIENDS_ONLY' && <Star className="w-5 h-5 text-gray-500" />}
              {privacy === 'ONLY_ME' && <Lock className="w-5 h-5 text-gray-500" />}
              <span className="text-gray-700 dark:text-gray-300">
                {privacy === 'PUBLIC' && 'Public'}
                {privacy === 'FOLLOWERS_ONLY' && 'Followers only'}
                {privacy === 'CLOSE_FRIENDS_ONLY' && 'Close friends only'}
                {privacy === 'ONLY_ME' && 'Only me'}
              </span>
            </div>
          </button>

          {/* Tags */}
          <div className="p-2">
            <div className="flex items-center space-x-3 mb-2">
              <Tag className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Tags</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="flex-1 p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={media.length === 0 || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showLocationPicker && (
        <LocationPicker
          onSelect={(loc) => {
            setLocation(loc);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {showPrivacySelector && (
        <PrivacySelector
          selected={privacy}
          onSelect={setPrivacy}
          onClose={() => setShowPrivacySelector(false)}
        />
      )}
    </div>
  );
};

export default CreatePost;