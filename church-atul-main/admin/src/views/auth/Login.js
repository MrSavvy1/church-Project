import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import {
  Card,
  Row,
  Col,
  CardTitle,
  CardBody,
  Button,
  FormGroup,
  Label,
  Input,
  Spinner,
} from "reactstrap";
import { useUserContext } from "../../context/Context";

const Login = () => {
  const { signIn, permissions } = useUserContext();
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayPassword, setDisplayPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setDisplayPassword(!displayPassword);
  };

  const loginUser = async () => {
    setLoading(true);

    let data = {
      useremail: userEmail,
      password: password,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_API_URL}/api/accounts/signin_admin`,
        data
      );
      console.log("Response received:", response.data); // Log the response data
      toast.success(response.data.message);

      // Set user and permissions in context
      signIn(response.data.user);
      permissions(response.data.permission);
      localStorage.setItem("token", response.data.token);

      // Check if role is admin
      console.log("User role:", response.data.user.role); // Log user role
      if (response.data.user.role === "admin") {
        console.log("Admin Role Detected");
        // Log permission object to ensure it's correct
        console.log("Permissions:", response.data.permission);

        if (response.data.permission?.churchPermission === true) {
          console.log("Navigating to /admin/church_list");
          navigate("/admin/church_list");
          return;
        }
        if (response.data.permission?.notificationPermission === true) {
          console.log("Navigating to /admin/notification_list");
          navigate("/admin/notification_list");
          return;
        }
        if (response.data.permission?.transactionPermission === true) {
          console.log("Navigating to /admin/transaction_list");
          navigate("/admin/transaction_list");
          return;
        }
      } else {
        console.log("Navigating to /admin/user_list");
        navigate("/admin/user_list");
      }
    } catch (error) {
      console.error("Error during login:", error); // Log the error
      if (error.response?.status === 401) {
        toast.error(error.response.data.message);
      }
      if (error.response?.status === 500) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="d-flex align-items-center h-100">
      <Col sm={12} md={4} className="mx-auto">
        <Card className="p-5">
          <CardTitle tag="h6" className="border-bottom p-3 mb-0 text-center">
            <h3>Church App Admin Dashboard</h3>
          </CardTitle>
          <CardBody>
            <div>
              <FormGroup>
                <Label for="exampleEmail">Email</Label>
                <Input
                  id="exampleEmail"
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label for="examplePassword">Password</Label>
                <div className="position-relative">
                  <Input
                    id="examplePassword"
                    name="password"
                    placeholder="Password"
                    type={displayPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    onClick={togglePasswordVisibility}
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                    type="button"
                  >
                    {!displayPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </div>
              </FormGroup>
              <div className="text-center">
                <Button
                  className="mt-2 flex gap-x-4 items-center"
                  onClick={loginUser}
                >
                  Submit {loading && <Spinner size="sm" />}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
