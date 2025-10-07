import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Dots } from "./Dots";
import { CountryBordersGeo } from "./CountryBordersGeo";
import { EmailModal } from "./components/EmailModal";
import { submitImageForApproval } from "./lib/pending-images";
import { sendAdminApprovalEmail, sendUserConfirmationEmail } from "./lib/email-service";
import "./App.css";
import { Suspense } from "react";

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

  const dotsRef = useRef();

  const handleClickFromGlobe = () => {
    dotsRef.current?.triggerDotClick();
  };

  const toggleBorders = () => {
    setShowBorders(!showBorders);
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
      <Canvas camera={{ position: [0, 0, 15], near: 1, far: 50 }} style={{ width: "100vw", height: "95vh" }}>
        <ambientLight />
        <Sphere radius={radius} />
        <Suspense fallback={null}>
          <CountryBordersGeo radius={radius} visible={showBorders} color="#000000" lineWidth={1.5} offset={0.00} 
          yawDeg={181.0} 
          pitchDeg={180} 
          rollDeg={0}
          // invertY={true}
          // invertX={true} 
          // invertZ={true}
          />
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