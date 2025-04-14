import { useState, useEffect, useRef } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import { FiUpload, FiX, FiCheck, FiChevronLeft, FiChevronRight, FiAlertCircle, FiInfo } from "react-icons/fi"
import useUserStore from "../context/userStore" // Import the user store

// Assuming ReviewApplicants is imported from a separate file
import ReviewApplicants from "../components/Applicant/ReviewApplicants"

function Upload({ onClose }) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [flaggedApplicants, setFlaggedApplicants] = useState([])
  const [reviewing, setReviewing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const [positions, setPositions] = useState([]) // Store all positions
  const { user } = useUserStore() // Get current user from store

  // Fetch available positions from the API
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/company/positions`
        );
        if (response.data && response.data.length > 0) {
          setPositions(response.data);
          console.log("Fetched positions:", response.data);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        setMessage({ type: "error", text: "Failed to fetch positions" });
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    if (!reviewing) {
      setIsUploading(false)
    }
  }, [reviewing])

  const resetStates = () => {
    setIsUploading(false)
    setMessage(null)
    setApplicants([])
    setFlaggedApplicants([])
    setReviewing(false)
    setCurrentIndex(0)
  }

  // Function to find position ID by name
  const findPositionIdByName = (positionName) => {
    if (!positionName || !positions.length) return null;
    
    // Case-insensitive search
    const position = positions.find(
      pos => pos.name && pos.name.toLowerCase() === positionName.toLowerCase()
    );
    
    // If exact match not found, try partial match
    if (!position) {
      const partialMatch = positions.find(
        pos => pos.name && positionName.toLowerCase().includes(pos.name.toLowerCase())
      );
      return partialMatch ? partialMatch.id : null;
    }
    
    return position ? position.id : null;
  }

  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569)
    const utc_value = utc_days * 86400
    const date_info = new Date(utc_value * 1000)

    const fractional_day = serial - Math.floor(serial) + 0.0000001
    let total_seconds = Math.floor(86400 * fractional_day)
    const seconds = total_seconds % 60
    total_seconds -= seconds

    const hours = Math.floor(total_seconds / (60 * 60))
    const minutes = Math.floor(total_seconds / 60) % 60

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds)
  }

  const mapExcelDataToApplicant = (excelRow) => {
    // Try to find position ID by name from the Excel data
    const positionName = excelRow.position_applied || excelRow.position || "";
    const positionId = findPositionIdByName(positionName);
    
    if (positionName && !positionId) {
      console.log(`Position not found for: "${positionName}"`);
    }
    
    return {
      first_name: excelRow.first_name || excelRow.firstName || "",
      middle_name: excelRow.middle_name || excelRow.middleName || "",
      last_name: excelRow.last_name || excelRow.lastName || "",
      gender: excelRow.gender || "",
      birth_date:
        typeof excelRow.birth_date === "number"
          ? excelDateToJSDate(excelRow.birth_date).toISOString().split("T")[0]
          : excelRow.birth_date || excelRow.birthDate || null,
      discovered_at: excelRow.discovered_at || "Unknown",
      email: excelRow.email || excelRow.email_1 || "",
      email_1: excelRow.email || excelRow.email_1 || "",
      email_2: excelRow.email_2 || "",
      email_3: excelRow.email_3 || "",
      contactNo: excelRow.contact_no || excelRow.contactNo || excelRow.mobile_number_1 || "",
      mobile_number_1: excelRow.contact_no || excelRow.contactNo || excelRow.mobile_number_1 || "",
      mobile_number_2: excelRow.mobile_number_2 || "",
      position_id: positionId || (positions.length > 0 ? positions[0].id : "default-position-id"),
      position_name: positionName, // Store the original position name for reference
      applied_source: excelRow.source || "Excel Upload",
      created_by: user?.user_id || excelRow.created_by || "system",
      updated_by: user?.user_id || excelRow.updated_by || "system",
      cv_link: excelRow.cv_link || null,
    }
  }

  const forwardToBackend = async (applicants) => {
    setIsUploading(true)
    setMessage({ type: "info", text: "Uploading applicants..." })

    try {
      const formattedApplicants = JSON.stringify(applicants)
      const formData = new FormData()
      formData.append("applicants", formattedApplicants)

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/applicants/add/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )

      console.log("Backend response:", response.data)

      if (response.data.flagged && response.data.flagged.length > 0) {
        setFlaggedApplicants(response.data.flagged)
        setReviewing(true)
      } else {
        setMessage({ type: "success", text: response.data.message })
      }
    } catch (error) {
      console.error("Upload error:", error)
      console.error("Error details:", error.response?.data)
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error uploading applicants",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      processFile(file)
    }
  }

  const processFile = async (file) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setMessage({ type: "error", text: "Please upload an Excel file (.xlsx or .xls)" })
      return
    }

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        setMessage({ type: "error", text: "No data found in the Excel file" })
        return
      }

      const mappedApplicants = jsonData.map(mapExcelDataToApplicant)
      console.log("Mapped applicants:", mappedApplicants)
      setApplicants(mappedApplicants)
      await forwardToBackend(mappedApplicants)
    } catch (error) {
      console.error("File processing error:", error)
      setMessage({ type: "error", text: "Error processing Excel file" })
    }
  }

  const handleAccept = async (index) => {
    try {
      setIsUploading(true)
      const acceptedApplicant = flaggedApplicants[index].applicant

      // Find position ID if it wasn't found during initial mapping
      let positionId = acceptedApplicant.position_id;
      if (acceptedApplicant.position_name && (!positionId || positionId === "default-position-id")) {
        positionId = findPositionIdByName(acceptedApplicant.position_name);
        if (!positionId && positions.length > 0) {
          positionId = positions[0].id; // Fallback to first position if none found
        }
      }

      // Create payload similar to AddApplicantForm.jsx
      const payload = {
        applicant: JSON.stringify({
          first_name: acceptedApplicant.first_name,
          middle_name: acceptedApplicant.middle_name,
          last_name: acceptedApplicant.last_name,
          birth_date: acceptedApplicant.birth_date,
          gender: acceptedApplicant.gender,
          email_1: acceptedApplicant.email_1,
          mobile_number_1: acceptedApplicant.mobile_number_1,
          cv_link: acceptedApplicant.cv_link,
          discovered_at: acceptedApplicant.discovered_at,
          referrer_id: acceptedApplicant.referrer_id,
          created_by: user?.id || acceptedApplicant.created_by || "system",
          updated_by: user?.id || acceptedApplicant.updated_by || "system",
          company_id: acceptedApplicant.company_id,
          position_id: positionId,
          test_result: acceptedApplicant.test_result,
          date_applied: acceptedApplicant.date_applied,
        }),
      }

      console.log("Accepted applicant payload:", payload)

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/applicants/add`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.status === 201) {
        setMessage({ type: "success", text: "Applicant accepted and saved successfully" })
     
        setFlaggedApplicants(flaggedApplicants.filter((_, i) => i !== index))

     
        if (index >= flaggedApplicants.length - 1) {
          setCurrentIndex(0)
        }
      }
    } catch (error) {
      console.error("Error accepting applicant:", error)
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error saving accepted applicant",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReject = (index) => {
    setFlaggedApplicants(flaggedApplicants.filter((_, i) => i !== index))
    if (index >= flaggedApplicants.length - 1) {
      setCurrentIndex(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < flaggedApplicants.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Handle close function
  const handleClose = () => {
    resetStates()
    if (onClose && typeof onClose === "function") {
      onClose()
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="relative bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-[#d9ebeb] pb-4">
        <h2 className="text-xl font-semibold text-[#008080]">Upload Applicants</h2>
        <button
          onClick={handleClose}
          className="flex items-center text-gray-500 hover:text-[#008080] transition-colors"
          aria-label="Close"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {!reviewing ? (
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? "border-[#008080] bg-[#d9ebeb]" : "border-gray-300 hover:border-[#66b2b2]"
            } transition-all duration-200 cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="hidden"
              id="upload-input"
              ref={fileInputRef}
              disabled={isUploading}
            />
            <label htmlFor="upload-input" className="flex flex-col items-center justify-center cursor-pointer">
              <FiUpload className="w-12 h-12 text-[#66b2b2] mb-3" />
              <p className="text-[#008080] font-medium mb-2">
                {isUploading ? "Uploading..." : "Drag & drop your Excel file here"}
              </p>
              <p className="text-gray-500 text-sm mb-4">or</p>
              <button
                type="button"
                className="bg-[#008080] hover:bg-[#006666] text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
                onClick={handleBrowseFiles}
                disabled={isUploading}
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Browse Files
              </button>
            </label>
            <p className="mt-4 text-sm text-gray-500">Supported formats: .xlsx, .xls</p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-md flex items-start ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : message.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : message.type === "warning"
                      ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                      : "bg-[#d9ebeb] text-[#008080] border border-[#66b2b2]"
              }`}
            >
              {message.type === "success" ? (
                <FiCheck className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              ) : message.type === "error" ? (
                <FiAlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              ) : (
                <FiInfo className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-50 p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[#d9ebeb]">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#008080]">Review Flagged Applicants</h3>
                <button onClick={handleClose} className="text-gray-500 hover:text-[#008080]">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ReviewApplicants
              applicants={flaggedApplicants}
              currentIndex={currentIndex}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onAccept={handleAccept}
              onReject={handleReject}
              onClose={handleClose}
            />

            {/* Navigation controls */}
            <div className="p-4 border-t border-[#d9ebeb] flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {flaggedApplicants.length > 0
                  ? `${currentIndex + 1} of ${flaggedApplicants.length}`
                  : "No applicants to review"}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 || flaggedApplicants.length === 0}
                  className={`p-2 rounded-full ${
                    currentIndex === 0 || flaggedApplicants.length === 0
                      ? "text-gray-300"
                      : "text-[#008080] hover:bg-[#d9ebeb]"
                  }`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= flaggedApplicants.length - 1 || flaggedApplicants.length === 0}
                  className={`p-2 rounded-full ${
                    currentIndex >= flaggedApplicants.length - 1 || flaggedApplicants.length === 0
                      ? "text-gray-300"
                      : "text-[#008080] hover:bg-[#d9ebeb]"
                  }`}
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload