import api from "../api/axios";
import moment from "moment";
import { filterCounter } from "./statusCounterFunctions";
import { useApplicantData } from "../hooks/useApplicantData";

export const fetchApplicants = async (setApplicantData) => {
    const { data } = await api.get(`/applicants`);
    setApplicantData(data);
}

export const filterApplicants = async (position, setApplicantData, status, date, dateType) => {
    
    let sql = "/applicants/filter?";
    position != "All" ? sql += `position=${position}` : sql += "";
    date !== "Invalid date" ? sql += `&${dateType}=${date}` : sql += "";
    
    if (status.length === 0 && position === "All" && date === "") {
        fetchApplicants(setApplicantData);
    }
    else {
        status.forEach((statusItem) => {
            sql += `&status=${statusItem}`;
          });
        const { data } = await api.get(sql);
        setApplicantData(data);
    }
}

export const searchApplicant = async (searchValue, setApplicantData, positionFilter, status, dateFilterType, dateFilter) => {
    let sql = "/applicants/search?";
    if (searchValue === "") {  
        if (positionFilter === "All" && status == [] && dateFilter === "") {
            fetchApplicants(setApplicantData);
        }     
        else {
            dateFilterType === 'month' ?
            filterApplicants(positionFilter, setApplicantData, status, moment(dateFilter).format("MMMM"), dateFilterType) :
            filterApplicants(positionFilter, setApplicantData, status, moment(dateFilter).format("YYYY"), dateFilterType);
        }
    }
    else if (searchValue !== "") {
        sql += `searchQuery=${searchValue}`;
        positionFilter !== "All" ? sql += `&position=${positionFilter}` : sql += "";
        status.forEach((statusItem) => {
            sql += `&status=${statusItem}`;
        });
        if (moment(dateFilter).format("MMMM") !== "Invalid date") {
            if (dateFilterType === "month") {
                sql += `&month=${moment(dateFilter).format("MMMM")}`;
            }
            else if (dateFilterType === "year") {
                sql += `&year=${moment(dateFilter).format("YYYY")}`;
            }
        }
        const { data } = await api.get(sql);
        setApplicantData(data); 
    }
}

  export const updateStatus = async (id, progress_id, Status, status, applicantData, setApplicantData, positionFilter, setStages, initialStages, setPositionFilter, user) => {
    let data = {
      "progress_id": progress_id,
      "status": Status,
      "user_id": user.user_id,
    };
  
    try {
      await api.put(`/applicant/update/status`, data);
      const updatedApplicantData = applicantData.map(applicant => 
        applicant.applicant_id === id ? { ...applicant, status: Status } : applicant
      );
      setApplicantData(updatedApplicantData);
      filterCounter(positionFilter, setStages, initialStages, setPositionFilter, status);
    } catch (error) {
      console.error("Update Status Failed: " + error);
    }
  };