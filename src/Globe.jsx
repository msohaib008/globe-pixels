import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Dots } from "./Dots";
import { CountryBordersGeo } from "./CountryBordersGeo";
import { EmailModal } from "./components/EmailModal";
import { SkyModel } from "./components/SkyModel";
import { submitImageForApproval, getPendingImages } from "./lib/pending-images";
import { sendAdminApprovalEmail, sendUserConfirmationEmail } from "./lib/email-service";
import "./App.css";
import { Suspense } from "react";
import night from "./assets/night.jpg";

const Sphere = ({ radius = 6 }) => (
  <mesh castShadow>
    <sphereBufferGeometry attach="geometry" args={[radius, 52, 52]} />
    <meshPhongMaterial
      attach="material"
      opacity={0.7}
      shininess={20}
      color="#000000"
      transparent
    />
  </mesh>
);

export default function Globe({ radius = 8, dotsOffset = 0 }) {
  const [minZoom, setMinZoom] = useState(radius + 1.5);
  const [showBorders, setShowBorders] = useState(true);
  
  // Email modal state
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    dotId: null,
    file: null,
    isLoading: false
  });

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");

  const dotsRef = useRef();

  const handleClickFromGlobe = () => {
    dotsRef.current?.triggerDotClick();
  };

  const toggleBorders = () => {
    setShowBorders(!showBorders);
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchError("Please enter a dot ID");
      return;
    }

    const dotId = parseInt(searchInput.trim());
    if (isNaN(dotId)) {
      setSearchError("Please enter a valid number");
      return;
    }

    setSearchError("");
    
    // Search for the dot and focus on it
    console.log(`🔍 Globe: Searching for dot ${dotId}`);
    const found = dotsRef.current?.searchAndFocusDot(dotId);
    if (!found) {
      setSearchError(`Dot ID ${dotId} not found or not available yet`);
    } else {
      console.log(`✅ Globe: Successfully found and focused on dot ${dotId}`);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
    if (searchError) setSearchError(""); // Clear error when typing
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Debug function to check database status
  const checkDatabaseStatus = async () => {
    console.log('🔍 Checking database status...');
    
    // Check pending images
    const pendingImages = await getPendingImages();
    console.log('📋 Pending images:', pendingImages);
    
    // Check manifest
    const { fetchManifest } = await import('./lib/firebase.js');
    const manifest = await fetchManifest();
    console.log('📋 Manifest:', manifest);
    
    // Check approved dots
    const { getAllDots } = await import('./lib/firebase.js');
    const approvedDots = await getAllDots();
    console.log('✅ Approved dots:', approvedDots);
    
    alert(`Database Status:
Pending Images: ${pendingImages.length}
Approved Dots: ${approvedDots.length}
Manifest Dots: ${manifest.dots?.length || 0}

Check console for details.`);
  };

  // Fix manifest function - maps invalid dot IDs to valid position IDs
  const fixManifest = async () => {
    console.log('🔧 Fixing manifest...');
    
    const { fetchManifest, saveManifest, getAllDots } = await import('./lib/firebase.js');
    
    // Get current manifest
    const manifest = await fetchManifest();
    console.log('Current manifest:', manifest);
    
    // Get all approved dots
    const approvedDots = await getAllDots();
    console.log('Approved dots:', approvedDots);
    
    if (approvedDots.length === 0) {
      alert('No approved dots found!');
      return;
    }
    
    // Get valid position IDs from Dots component
    const positions = dotsRef.current?.userData?.positions;
    if (!positions || positions.length === 0) {
      alert('No valid positions found! Make sure the globe has loaded.');
      return;
    }
    
    console.log('Valid positions:', positions.length);
    console.log('Position ID range:', positions[0]?.id, 'to', positions[positions.length - 1]?.id);
    
    // Simple fix: just use the first few valid positions
    const validDotIds = [];
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./lib/firebase.js');
    
    console.log('🔍 Processing approved dots...');
    
    for (let i = 0; i < approvedDots.length; i++) {
      const oldDotId = approvedDots[i].id;
      const newPositionId = positions[i].id; // Use first available positions
      
      console.log(`Mapping dot ${oldDotId} to position ${newPositionId}`);
      
      // Create new dot document with the valid position ID
      const dotData = {
        ...approvedDots[i],
        dotId: newPositionId,
        originalDotId: oldDotId, // Keep reference to original ID
        updatedAt: new Date().toISOString()
      };
      
      // Save with new position ID as document ID
      await setDoc(doc(db, 'dots', newPositionId.toString()), dotData);
      
      // Delete old document if it has a different ID
      if (oldDotId !== newPositionId.toString()) {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'dots', oldDotId));
        console.log(`✅ Moved dot from ${oldDotId} to ${newPositionId}`);
      }
      
      validDotIds.push(newPositionId);
    }
    
    console.log('Mapping approved dots to valid positions:', validDotIds);
    
    // Update manifest with valid dot IDs
    const newManifest = { dots: validDotIds };
    await saveManifest(newManifest);
    
    console.log('✅ Manifest updated with valid dot IDs:', newManifest);
    alert(`✅ Manifest fixed!
    
Updated manifest with ${validDotIds.length} valid dot IDs.
The globe should now display your images!`);
    
    // Reload the page to refresh the dots
    window.location.reload();
  };

  // Handle image selection from Dots component
  const handleImageSelected = (imageData) => {
    setEmailModal({
      isOpen: true,
      dotId: imageData.dotId,
      file: imageData.file,
      isLoading: false
    });
  };

  // Email modal handlers
  const handleEmailSubmit = async (userEmail) => {
    setEmailModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { dotId, file } = emailModal;
      
      // Optimize image first
      const { optimizeImageToSize, fileToBase64 } = await import('./lib/image-optimizer.js');
      const optimizedFile = await optimizeImageToSize(file, 500);
      const imageData = await fileToBase64(optimizedFile);
      
      // Submit for approval
      const submissionResult = await submitImageForApproval({
        dotId: dotId,
        userEmail: userEmail,
        imageData: imageData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      if (submissionResult.success) {
        // Send admin notification email
        await sendAdminApprovalEmail({
          userEmail: userEmail,
          dotId: dotId,
          imagePreview: imageData,
          fileName: file.name,
          fileSize: file.size
        });
        
        // Send user confirmation email
        await sendUserConfirmationEmail({
          userEmail: userEmail,
          dotId: dotId,
          status: 'pending'
        });
        
        // Show success message
        console.log(`✅ Image submitted for approval: Dot ${dotId} by ${userEmail}`);
        alert(`✅ Image submitted for approval!\n\nYou'll receive an email confirmation shortly.\nAdmin will review your image before it appears on the globe.`);
        
        // Close modal
        setEmailModal({
          isOpen: false,
          dotId: null,
          file: null,
          isLoading: false
        });
        
      } else {
        throw new Error(submissionResult.error || 'Failed to submit image');
      }
      
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`❌ Failed to submit image: ${error.message}`);
      setEmailModal(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const handleEmailModalClose = () => {
    if (!emailModal.isLoading) {
      setEmailModal({
        isOpen: false,
        dotId: null,
        file: null,
        isLoading: false
      });
    }
  };

  return (
    <>
      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={handleEmailModalClose}
        onSubmit={handleEmailSubmit}
        dotId={emailModal.dotId}
        fileName={emailModal.file?.name}
        fileSize={emailModal.file?.size}
        isLoading={emailModal.isLoading}
      />
      <div style={{position: "absolute", top: 0, left: 0}}>
        <img src={night} alt="Night" style={{height: "99.5vh", width: "100vw"}} />
      </div>
      <div style={{position: "absolute", top: 20, zIndex: 1, left: 20}}>
        <button className="upload-button" onClick={handleClickFromGlobe}>Place Image Randomly</button>

        {/* <button 
          className="upload-button" 
          onClick={toggleBorders}
          style={{ marginLeft: "10px", backgroundColor: showBorders ? "#4ca6a8" : "#666" }}
        >
          {showBorders ? "Hide" : "Show"} Country Border
        </button> */}
      </div>
      
      {/* Search Input */}
      <div style={{position: "absolute", top: 20, zIndex: 1, right: 20, display: "flex", flexDirection: "column", alignItems: "flex-end"}}>
        <div style={{display: "flex", alignItems: "center", marginBottom: "5px"}}>
          <input
            type="text"
            placeholder="Search dot by ID..."
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyPress={handleSearchKeyPress}
            style={{
              padding: "8px 12px",
              border: "2px solid #4ca6a8",
              borderRadius: "4px",
              fontSize: "14px",
              width: "200px",
              outline: "none",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              marginRight: "8px"
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4ca6a8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Search
          </button>
        </div>
        {searchError && (
          <div style={{
            color: "#ff4444",
            fontSize: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "4px 8px",
            borderRadius: "4px",
            marginTop: "2px"
          }}>
            {searchError}
          </div>
        )}
      </div>
      <Canvas camera={{ position: [0, 0, 15], near: 1, far: 100 }} style={{ width: "100vw", height: "95vh" }}>
        {/* 3D Sky Model Background */}
        <Suspense fallback={null}>
          <SkyModel />
        </Suspense>
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
        
        <Sphere radius={radius} />
        <Suspense fallback={null}>
          {/* <CountryBordersGeo radius={radius} visible={showBorders} color="#000000" lineWidth={1.5} offset={0.00} 
          yawDeg={181.0} 
          pitchDeg={180} 
          rollDeg={0}
          // invertY={true}
          // invertX={true} 
          // invertZ={true}
          /> */}
          <Dots radius={radius + dotsOffset / 10} ref={dotsRef} onImageSelected={handleImageSelected} />
        </Suspense>
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          minDistance={radius + 1.1}
          maxDistance={radius * 5}
        />
      </Canvas>
    </>
  );
} 