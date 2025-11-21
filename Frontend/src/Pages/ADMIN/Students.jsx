import AdminLayout from "./common/AdminLayout";
import UserManagementTable from "../../components/Admin/UserManagementTable";
import { fetchUsers, updateUserStatus } from "../../Redux/userSlice";

const Students = () => {
  return (
    <AdminLayout title="Students" subtitle="Manage all registered students">
      <UserManagementTable
        userType="student"
        fetchAction={fetchUsers}
        updateStatusAction={updateUserStatus}
        stateKey="users"
        apiEndpoint="/api/admin/users"
        showViewButton={false}
      />
    </AdminLayout>
  );
};

export default Students;
