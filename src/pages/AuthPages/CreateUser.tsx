import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import CreateUserForm from "../../components/auth/CreateUserForm";

export default function CreateUser() {
  return (
    <>
      <PageMeta
        title="Tạo tài khoản - XeTiic"
        description="Tạo tài khoản mới cho hệ thống quản lý vận tải"
      />
      <AuthLayout>
        <CreateUserForm />
      </AuthLayout>
    </>
  );
}
