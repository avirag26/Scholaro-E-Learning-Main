import AdminLayout from "./common/AdminLayout";
import UserManagementTable from "../../components/Admin/UserManagementTable";
import { fetchTutors, updateTutorStatus } from "../../Redux/tutorSlice";

const Tutors = () => {
  return (
    <AdminLayout title="Tutors" subtitle="Manage all registered tutors">
      <UserManagementTable
        userType="tutor"
        fetchAction={fetchTutors}
        updateStatusAction={updateTutorStatus}
        stateKey="tutors"
        apiEndpoint="/api/admin/tutors"
        showViewButton={true}
        viewRoute="/admin/tutors"
      />
    </AdminLayout>
  );
};

export default Tutors;
