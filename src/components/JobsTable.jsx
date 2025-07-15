import DataTable from 'react-data-table-component';
import { useState, useEffect, useRef } from 'react';
import jobStore from '../context/jobListingStore';
import { fetchJobs, updateJob, fetchCloseJobsCount, fetchOpenJobsCount, getOpenJobs, getCloseJobs } from '../services/jobsService';
import JobCountStore from '../context/jobsCountStore';
import setupStore from '../context/setupStore';
import industriesStore from '../context/industriesStore';
import { fetchSetups } from '../services/setupService';
import { fetchIndustries } from '../services/industriesService';
import { FaTrash } from "react-icons/fa";

const JobsTable = () => {
    const { jobsData, setJobsData, activeTab, setActiveTab } = jobStore();
    const [toasts, setToasts] = useState([]);
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const { setOpenJobsCount, setCloseJobsCount } = JobCountStore();
    const [jobData, setJobData] = useState({});
    const { setupData, setSetupData } = setupStore();
    const { industries, setIndustries } = industriesStore();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const descriptionRef = useRef(null);
    const responsibilitiesRef = useRef(null);
    const requirementsRef = useRef(null);
    const preferredQualificationsRef = useRef(null);
    const responsibilityHeaderRef = useRef(null);
    const requirementHeaderRef = useRef(null);
    const qualificationHeaderRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);



    useEffect(() => {
        const getJobsData = async () => {
            await fetchJobs(setJobsData);
            await fetchSetups(setSetupData);
            await fetchIndustries(setIndustries);
        }
        getJobsData();
    }, [])

    const handleJobRowClick = (row) => {
        setJobData(row)
        // console.log("Selected Job Data:", row);
        setIsAddJobModalOpen(true);
    };

    useEffect(() => {
        const refs = [
            descriptionRef,
            responsibilitiesRef,
            requirementsRef,
            preferredQualificationsRef,
            responsibilityHeaderRef,
            requirementHeaderRef,
            qualificationHeaderRef,
        ];

        refs.forEach((ref) => {
            if (ref.current) {
                ref.current.style.height = "auto";
                ref.current.style.height = `${ref.current.scrollHeight}px`;
            }
        });
    }, [
        jobData.description,
        jobData.responsibility,
        jobData.requirement,
        jobData.preferredQualification,
        jobData.responsibilityHeader,
        jobData.requirementHeader,
        jobData.qualificationHeader,
    ]);

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        try {
            // console.log("Submitting Job Data for UPDATE:", jobData);
            await updateJob(jobData);
            if (activeTab === "open") {
                getOpenJobs(setJobsData);
            } else if (activeTab === "close") {
                getCloseJobs(setJobsData);
            } else {
                fetchJobs(setJobsData);
            }
            await fetchCloseJobsCount(setCloseJobsCount);
            await fetchOpenJobsCount(setOpenJobsCount);
            setIsAddJobModalOpen(false);
        } catch (error) {
            console.error('Error updating job:', error);
        }
        finally {
            setIsLoading(false);
        }
    };


    const handleChange = (e) => {
        setJobData({ ...jobData, [e.target.name]: e.target.value });
    };


    const columns = [
        { name: 'Title', selector: row => row.jobTitle, sortable: true },
        { name: 'Industry', selector: row => row.industryName, sortable: true },
        { name: 'Employment Type', selector: row => row.employmentType, sortable: true },
        { name: 'Status', selector: row => row.isOpen == "1" ? "Open" : "Closed", sortable: true },
        { name: 'Setup', selector: row => row.setupName, sortable: true },
        // { name: 'Visibility', selector: row => row.isShown == "1" ? "Shown" : "Hidden", sortable: true }
    ];

    return (
        <>
            {jobsData.length === 0 ? (
                <div className="text-center text-lg font-semibold text-gray-600 mt-8">
                    No jobs found.
                </div>
            ) : (
                <DataTable
                    pointerOnHover
                    highlightOnHover
                    fixedHeaderScrollHeight="50vh"
                    responsive
                    columns={columns}
                    data={jobsData.filter(job => job.isShown == "1")}
                    onRowClicked={handleJobRowClick}
                    pagination
                    progressPending={!jobsData.length}
                    progressComponent={<LoadingComponent />}
                />
            )}

            {/* <div className="fixed top-4 right-4 space-y-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        removeToast={() => setToasts(toasts.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div> */}

            {/* Edit Job Modal */}
            {isAddJobModalOpen && (

                <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="bg-white p-6 rounded-lg text-gray-dark border border-gray-light w-full max-w-3xl sm:max-w-2xl md:max-w-[80vw]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="headline">Edit Job</h2>
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="p-1 rounded hover:bg-red-100 transition-colors cursor-pointer"
                                    title="Delete Job"
                                >
                                    <FaTrash className="size-4 text-red-500 hover:text-red-600" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 body-regular">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Job Title */}
                                    <div>
                                        <label className="block">Job Title</label>
                                        <input
                                            type="text"
                                            name="jobTitle"
                                            value={jobData.jobTitle}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                            required
                                        />
                                    </div>

                                    {/* Industry */}
                                    <div>
                                        <label className="block">Industry</label>
                                        <select
                                            name="industryId"
                                            value={jobData.industryId}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            {industries.map((industry, index) => (
                                                <option key={index} value={industry.industryId}>{industry.industryName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block">Description</label>
                                    <textarea
                                        ref={descriptionRef}
                                        name="description"
                                        value={jobData.description}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden"
                                        required
                                    />
                                </div>

                                {/* Min and Max Salary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block">Min Salary</label>
                                        <input
                                            type="number"
                                            name="salaryMin"
                                            value={jobData.salaryMin}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block">Max Salary</label>
                                        <input
                                            type="number"
                                            name="salaryMax"
                                            value={jobData.salaryMax}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    {/* Employment Type */}
                                    <div>
                                        <label className="block">Employment Type</label>
                                        <select
                                            name="employmentType"
                                            value={jobData.employmentType}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>

                                    {/* Setup */}
                                    <div>
                                        <label className="block">Setup</label>
                                        <select
                                            name="setupId"
                                            value={jobData.setupId}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            {setupData.map((setup, index) => (
                                                <option key={index} value={setup.setupId}>{setup.setupName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

   <div className="mt-5 mb-3"> <hr /></div>
                                {/* Responsibilities */}
                                <div>
                                   
                                    <label className="block font-bold my-3">Section 1</label>
                                    <label className="block">Title <span className="text-gray-400 italic"> (Defaults to "Responsibilities" if left blank.)</span></label>
                                    <input
                                        ref={responsibilityHeaderRef}
                                        name="responsibilityHeader"
                                        value={jobData.responsibilityHeader}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden mb-3"
                                        required
                                    />
                                    <label className="block">Content</label>
                                    <textarea
                                        ref={responsibilitiesRef}
                                        name="responsibility"
                                        value={jobData.responsibility}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden"
                                        required
                                    />

                                </div>

                                 {/* Requirements */}
                                  <div>
                                   
                                    <label className="block font-bold my-3">Section 2</label>
                                    <label className="block">Title <span className="text-gray-400 italic"> (Defaults to "Requirements" if left blank.)</span></label>
                                    <input
                                        ref={requirementHeaderRef}
                                        name="requirementHeader"
                                        value={jobData.requirementHeader}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden mb-3"
                                        required
                                    />
                                    <label className="block">Content</label>
                                     <textarea
                                        ref={requirementsRef}
                                        name="requirement"
                                        value={jobData.requirement}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden"
                                        required
                                    />

                                </div>

                              

                                {/* Preferred Qualifications */}
                                     <div>
                                   
                                    <label className="block font-bold my-3">Section 3</label>
                                    <label className="block">Title <span className="text-gray-400 italic"> (Defaults to "Preferred Qualifications" if left blank.)</span></label>
                                    <input
                                        ref={qualificationHeaderRef}
                                        name="qualificationHeader"
                                        value={jobData.qualificationHeader}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden mb-3"
                                        required
                                    />
                                    <label className="block">Content</label>
                                    <textarea
                                        ref={preferredQualificationsRef}
                                        name="preferredQualification"
                                        value={jobData.preferredQualification}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden"
                                    />

                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">

                                    {/* Status */}
                                    <div>
                                        <label className="block">Status</label>
                                        <select
                                            name="isOpen"
                                            value={jobData.isOpen}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            <option value="1">Open</option>
                                            <option value="0">Closed</option>
                                        </select>
                                    </div>

                                    {/* Visibility */}
                                    <div>
                                        {/* <label className="block">Visibility</label> */}
                                        <select
                                            name="isShown"
                                            value={jobData.isShown}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md hidden"
                                        >
                                            <option value="1">Shown</option>
                                            <option value="0">Hidden</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddJobModalOpen(false)}
                                        className="px-4 py-2 bg-white border border-teal text-teal rounded-md cursor-pointer hover:bg-teal/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-teal text-white rounded-md cursor-pointer hover:bg-teal/70">
                                        {isLoading ? (
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            'Edit Job'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                </div >
            )}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                        <p className="mb-6">Are you sure you want to Delete this job?</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const updatedJob = {
                                            ...jobData,
                                            isShown: "0",
                                            isOpen: "0",
                                        };
                                        await updateJob(updatedJob);
                                        if (activeTab === "open") {
                                            getOpenJobs(setJobsData);
                                        } else if (activeTab === "close") {
                                            getCloseJobs(setJobsData);
                                        } else {
                                            fetchJobs(setJobsData);
                                        }
                                        await fetchCloseJobsCount(setCloseJobsCount);
                                        await fetchOpenJobsCount(setOpenJobsCount);
                                        setIsAddJobModalOpen(false);
                                        setIsDeleteConfirmOpen(false);
                                        setToasts(prev => [
                                            ...prev,
                                            {
                                                id: Date.now(),
                                                message: "Job hidden successfully",
                                                type: "success",
                                            },
                                        ]);
                                    } catch (error) {
                                        console.error("Error hiding job:", error);
                                    }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

function LoadingComponent() {
    return (
        <div className="flex flex-col w-full space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-sm bg-gray-light"></div>
            ))}
        </div>
    );
}

export default JobsTable;