import React, { useState, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddDonationForm = () => {
	// State for all our form fields
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('Clothing');
	const [condition, setCondition] = useState('Good'); // New state for condition
	const [imagePath, setImagePath] = useState(''); // This will hold the path (first image) from the backend
	const [imagePreview, setImagePreview] = useState(''); // preview URL to show (local or server thumbnail)
	const [localPreviews, setLocalPreviews] = useState([]); // local file previews while uploading
	const [uploading, setUploading] = useState(false); // To show a "loading" message

	const { user } = useAuth();
	const navigate = useNavigate();
	const fileInputRef = useRef(null);

	const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

	// This function handles ONLY the file upload
	const handleFileUpload = async (e) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		// Basic client-side validation
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		for (const f of files) {
			if (!allowedTypes.includes(f.type)) return alert('Only JPG and PNG images are allowed.');
			if (f.size > MAX_IMAGE_BYTES) return alert('Each image must be <= 5MB.');
		}

		// Create local previews immediately
		const previews = files.map((f) => URL.createObjectURL(f));
		// revoke any existing previews to avoid leaks
		if (localPreviews && localPreviews.length > 0) {
			localPreviews.forEach((u) => URL.revokeObjectURL(u));
		}
		setLocalPreviews(previews);
		setImagePreview(previews[0] || '');

		const formData = new FormData();
		// Append each file under the 'images' field (server expects 'images')
		files.forEach((f) => formData.append('images', f));
		setUploading(true);

		try {
			const config = { headers: { 'Content-Type': 'multipart/form-data' } };
			const { data } = await api.post('/api/upload', formData, config);

			// Server returns { images: [{ image, thumbnail }, ...] }
			if (data && data.images && Array.isArray(data.images) && data.images.length > 0) {
				setImagePath(data.images[0].image);
				// Prefer server thumbnail for consistent sizing
				setImagePreview(data.images[0].thumbnail || data.images[0].image);
			}
		} catch (error) {
			console.error('Upload failed', error);
			alert('Image upload failed. Please try again.');
		} finally {
			setUploading(false);
		}
	};


	// This function handles the FINAL form submission
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!user) {
			alert('Please log in to list an item.');
			navigate('/login');
			return;
		}

		if (!title || !description || !imagePath || !condition || !category) {
			return alert('Please fill out all fields and upload an image.');
		}

		try {
			const newDonation = {
				title,
				description,
				category,
				condition,
				imagePath,
			};

			const config = {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
			};

			await api.post('/api/donations', newDonation, config);

			alert('Thank you! Your item has been listed.');
      
			// Clear all form fields
			setTitle('');
			setDescription('');
			setCategory('Clothing');
			setCondition('Good');
			setImagePath('');
			setImagePreview('');
			// revoke and clear local previews
			if (localPreviews && localPreviews.length > 0) {
				localPreviews.forEach((u) => URL.revokeObjectURL(u));
				setLocalPreviews([]);
			}
			// Clear the file input using a ref
			if (fileInputRef.current) fileInputRef.current.value = null;

		} catch (error) {
			console.error('Failed to create donation:', error?.response?.data?.message || error.message);
			alert(`Error: ${error?.response?.data?.message || 'Server error'}`);
		}
	};

	return (
		<div className="mt-8 p-6 bg-gray-100 rounded-lg shadow-md">
			<h2 className="text-2xl font-bold mb-4">List a New Item for Donation</h2>
			<form onSubmit={handleSubmit}>
				{/* Item Title Input */}
				<div className="mb-4">
					<label htmlFor="title" className="block text-gray-700 font-bold mb-2">Item Title</label>
					<input
						type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g., Men's Winter Coat, Size M"
						className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
					/>
				</div>

				{/* Description Textarea */}
				<div className="mb-4">
					<label htmlFor="description" className="block text-gray-700 font-bold mb-2">Description</label>
					<textarea
						id="description" value={description} onChange={(e) => setDescription(e.target.value)}
						placeholder="Describe the item's condition, color, etc."
						rows="4" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
					></textarea>
				</div>

				{/* Condition Dropdown */}
				<div className="mb-4">
					<label htmlFor="condition" className="block text-gray-700 font-bold mb-2">Condition</label>
					<select
						id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}
						className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
					>
						<option>New</option>
						<option>Like New</option>
						<option>Good</option>
						<option>Fair</option>
					</select>
				</div>

				{/* Category Dropdown */}
				<div className="mb-4">
					<label htmlFor="category" className="block text-gray-700 font-bold mb-2">Category</label>
					<select
						id="category" value={category} onChange={(e) => setCategory(e.target.value)}
						className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
					>
						<option>Clothing</option>
						<option>Electronics</option>
						<option>Furniture</option>
						<option>Books</option>
						<option>Other</option>
					</select>
				</div>

				{/* Image Upload Field */}
				<div className="mb-6">
					<label className="block text-gray-700 font-bold mb-2">Image</label>
					<input
						type="file"
						id="image-file-input"
						ref={fileInputRef}
						accept="image/png, image/jpeg"
						multiple
						onChange={handleFileUpload}
						className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
					/>
					{uploading && <p className="text-sm text-gray-500 mt-2">Uploading image...</p>}
					{imagePath && <p className="text-sm text-green-600 mt-2">✓ Image uploaded successfully!</p>}
					{imagePreview && (
						<img src={imagePreview} alt="preview" className="mt-3 max-h-48 object-contain" />
					)}
					{/* show local previews if present (small thumbnails) */}
					{localPreviews && localPreviews.length > 0 && (
						<div className="flex gap-2 mt-2">
							{localPreviews.map((p, i) => (
								<img key={i} src={p} alt={`local-${i}`} className="w-16 h-16 object-cover rounded" />
							))}
						</div>
					)}
				</div>
        
				{/* Submit Button */}
				<button
					type="submit"
					className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-gray-400"
					disabled={uploading} // Disable button while uploading
				>
					{uploading ? 'Waiting for Image...' : 'List my Item'}
				</button>
			</form>
		</div>
	);
};

export default AddDonationForm;

