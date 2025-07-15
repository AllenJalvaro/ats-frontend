import { useEffect, useState, useRef } from "react";
import JobsTable from "../components/JobsTable";
import { FaGear, FaPlus } from "react-icons/fa6";
import IndustriesModal from "../components/Modals/IndustriesModal";
import { addJob, fetchCloseJobsCount, fetchOpenJobsCount, fetchJobs, searchJobs } from "../services/jobsService";
import jobStore from "../context/jobListingStore";
import setupStore from "../context/setupStore";
import industriesStore from "../context/industriesStore";
import useUserStore from "../context/userStore";
import JobCountStore from "../context/jobsCountStore";

const JobList = () => {
    const { setOpenJobsCount, setCloseJobsCount } = JobCountStore();
    const { user } = useUserStore();
    const [searchVal, setSearchVal] = useState("");
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const { industries, setIndustries } = industriesStore();
    const descriptionRef = useRef(null);
    const responsibilitiesRef = useRef(null);
    const requirementsRef = useRef(null);
    const preferredQualificationsRef = useRef(null);
    const responsibilityHeaderRef = useRef(null);
    const requirementHeaderRef = useRef(null);
    const qualificationHeaderRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    const [jobData, setJobData] = useState({
        title: "",
        industryId: "",
        description: "",
        minSalary: "0",
        maxSalary: "0",
        employmentType: "Full-time",
        setup: "",
        responsibilities: "",
        requirements: "",
        preferredQualifications: "",
        isOpen: "1",
        isShown: "1",
        userId: user.user_id,
        responsibilityHeader: "Responsibilities",
        requirementHeader: "Requirements",
        qualificationHeader: "Preferred Qualifications",
    });
    const { setupData, setSetupData } = setupStore();
    const { jobsData, setJobsData, isGearModalOpen, setIsGearModalOpen } = jobStore();

    useEffect(() => {
        if (industries.length > 0) {
            setJobData((prevJobData) => ({
                ...prevJobData,
                industryId: industries[0].industryId,
            }));
        }
    }, [industries]);

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
        jobData.responsibilities,
        jobData.requirements,
        jobData.preferredQualifications,
        jobData.responsibilityHeader,
        jobData.requirementHeader,
        jobData.qualificationHeader,
    ]);


    useEffect(() => {
        if (setupData.length > 0) {
            setJobData((prevJobData) => ({
                ...prevJobData,
                setupId: setupData[0].setupId,
            }));
        }
    }, [industries]);

    const handleChange = (e) => {
        setJobData({ ...jobData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        // console.log("Submitting Job Data:", jobData);
        await addJob(jobData);
        await fetchJobs(setJobsData);
        await fetchCloseJobsCount(setCloseJobsCount)
        await fetchOpenJobsCount(setOpenJobsCount);
        console.log("Job Data Submitted:", jobData);

        setIsLoading(true);
        resetForm();
        setIsAddJobModalOpen(false);
    };

    const resetForm = () => {
        // Clear jobData to initial values
        setJobData({
            title: "",
            industryId: industries[0]?.industryId || "",
            description: "",
            minSalary: "0",
            maxSalary: "0",
            employmentType: "Full-time",
            setup: "",
            responsibilities: "",
            requirements: "",
            preferredQualifications: "",
            isOpen: "1",
            isShown: "1",
            userId: user.user_id,
            responsibilityHeader: "Responsibilities",
            requirementHeader: "Requirements",
            qualificationHeader: "Preferred Qualifications",
        });

        // Clear the height of each ref
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
            }
        });
    };


    return (
        <div className="rounded-3xl bg-white p-6 pb-1 border border-gray-light">
            {/* Header Section */}
            <div className="mb-4 flex items-center justify-between gap-2">
                <h1 className="headline font-semibold text-gray-dark">Job List</h1>

                <div className="flex space-x-4 items-center">
                    <button
                        onClick={() => setIsAddJobModalOpen(true)}
                        className="rounded-md flex gap-2 body-regular text-center items-center px-3 bg-white border border-teal text-teal hover:bg-teal/20 cursor-pointer"
                    >
                        <FaPlus className="size-3" />
                        Job
                    </button>
                    <button
                        onClick={() => setIsGearModalOpen(true)}
                        className="rounded-md bg-white text-teal hover:text-teal/70 cursor-pointer"
                    >
                        <FaGear className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Search Filter Section */}
            <div className="mb-4 flex flex-wrap items-center gap-2 bg-teal-600/10 p-2 rounded-lg">
                <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-full sm:w-1/2 md:w-1/4 p-2 body-regular focus:outline-teal border border-gray-300 rounded-md"
                    onChange={(e) => {
                        setSearchVal(e.target.value); searchJobs(e.target.value, setJobsData);
                    }}
                />
            </div>

            {/* Jobs Table Section */}
            <div className="rounded-lg bg-white overflow-hidden">
                <JobsTable />
            </div>

            {/* Add Job Modal */}
            {isAddJobModalOpen && (

                <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="bg-white p-6 rounded-lg text-gray-dark border border-gray-light w-full max-w-3xl sm:max-w-2xl md:max-w-[80vw]">
                            <h2 className="headline mb-4">Add Job</h2>

                            <form onSubmit={handleSubmit} className="space-y-4 body-regular">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Job Title */}
                                    <div>
                                        <label className="block">Job Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={jobData.title}
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
                                                <option key={index} value={industry.industryId}>
                                                    {industry.industryName}
                                                </option>
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


                                {/* Salary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block">Min Salary</label>
                                        <input
                                            type="number"
                                            name="minSalary"
                                            value={jobData.minSalary}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block">Max Salary</label>
                                        <input
                                            type="number"
                                            name="maxSalary"
                                            value={jobData.maxSalary}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Employment Type & Setup */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block">Setup</label>
                                        <select
                                            name="setupId"
                                            value={jobData.setupId}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            {setupData.map((setup, index) => (
                                                <option key={index} value={setup.setupId}>
                                                    {setup.setupName}
                                                </option>
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
                                        name="responsibilities"
                                        value={jobData.responsibilities}
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
                                        name="requirements"
                                        value={jobData.requirements}
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
                                        name="preferredQualifications"
                                        value={jobData.preferredQualifications}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="w-full p-2 border border-gray-light rounded-md resize-none overflow-hidden"
                                    />

                                </div>

                                {/* Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block">Status</label>
                                        <select
                                            name="isOpen"
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-light rounded-md"
                                        >
                                            <option value="1">Open</option>
                                            <option value="0">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setIsAddJobModalOpen(false);
                                        }}
                                        className="px-4 py-2 bg-white border border-teal text-teal rounded-md cursor-pointer hover:bg-teal/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-teal text-white rounded-md cursor-pointer hover:bg-teal/70"
                                    >
                                        {isLoading ? (
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            'Save Job'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                </div>
            )}

            {/* Gear Modal */}
            {isGearModalOpen && <IndustriesModal onClose={() => setIsGearModalOpen(false)} />}
        </div >
    );
};

export default JobList;
