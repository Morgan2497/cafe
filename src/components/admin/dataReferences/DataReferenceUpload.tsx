import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';
import './DataReferenceUpload.css';

interface DataReference {
  id?: string;
  name: string;
  description: string;
  fileUrl: string;
  uploadDate: Date | Timestamp;
}

const DataReferenceUpload: React.FC = () => {
  const [dataReferences, setDataReferences] = useState<DataReference[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDataReferences();
  }, []);

  const fetchDataReferences = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'dataReferences'));
      const references = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DataReference[];
      
      setDataReferences(references);
    } catch (error) {
      console.error('Error fetching data references:', error);
      setError('Failed to load data references');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!name.trim()) {
      setError('Please provide a name for the reference');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `dataReferences/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const fileUrl = await getDownloadURL(storageRef);
      
      // Save reference to Firestore
      const dataReference: Omit<DataReference, 'id'> = {
        name,
        description,
        fileUrl,
        uploadDate: new Date()
      };
      
      await addDoc(collection(db, 'dataReferences'), dataReference);
      
      // Reset form
      setFile(null);
      setName('');
      setDescription('');
      setSuccess('Data reference uploaded successfully');
      
      // Refresh list
      fetchDataReferences();
    } catch (error) {
      console.error('Error uploading data reference:', error);
      setError('Failed to upload data reference');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (reference: DataReference) => {
    if (!reference.id || !window.confirm('Are you sure you want to delete this data reference?')) {
      return;
    }

    try {
      // Delete file from Storage
      if (reference.fileUrl) {
        const fileRef = ref(storage, reference.fileUrl);
        await deleteObject(fileRef);
      }
      
      // Delete document from Firestore
      await deleteDoc(doc(db, 'dataReferences', reference.id));
      
      // Refresh list
      fetchDataReferences();
      setSuccess('Data reference deleted successfully');
    } catch (error) {
      console.error('Error deleting data reference:', error);
      setError('Failed to delete data reference');
    }
  };

  return (
    <div className="data-reference-container">
      <h2>Data Reference Upload</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="data-reference-form">
        <div className="form-group">
          <label htmlFor="name">Reference Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="file">File:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Reference'}
        </button>
      </form>
      
      <div className="data-references-list">
        <h3>Uploaded References</h3>
        {dataReferences.length === 0 ? (
          <p>No data references uploaded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataReferences.map((reference) => (
                <tr key={reference.id}>
                  <td>
                    <a href={reference.fileUrl} target="_blank" rel="noopener noreferrer">
                      {reference.name}
                    </a>
                  </td>
                  <td>{reference.description}</td>
                  <td>
                    {reference.uploadDate instanceof Date 
                      ? reference.uploadDate.toLocaleDateString() 
                      : reference.uploadDate && 'seconds' in reference.uploadDate
                        ? new Date(reference.uploadDate.seconds * 1000).toLocaleDateString()
                        : 'Unknown date'}
                  </td>
                  <td>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(reference)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DataReferenceUpload;