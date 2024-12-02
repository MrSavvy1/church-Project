import axios from "axios";
import { useState } from "react";
import { toast }from "react-toastify";
import { useNavigate } from "react-router-dom";
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
} from "reactstrap";
import { useUserContext } from "../../context/Context";

const Login = () => {
    const {signIn, permissions} = useUserContext();
    const [userEmail, setUserEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const LoginButton = async () => {
        
        let data = {
            useremail: userEmail,
            password: password
        }

        await axios.post(`${process.env.REACT_APP_SERVER_API_URL}/api/accounts/signin_admin`, data)
            .then(function (response) {
                console.log(response.data);
                toast.success(response.data.message);
                signIn(response.data.user);
                permissions(response.data.permission);
                localStorage.setItem('token', response.data.token);
                if(response.data.user.role == 'admin') {
                    if(response.data.permission?.churchPermission == true) {
                        navigate("/admin/church_list");
                        return
                    }
                    if(response.data.permission?.notificationPermission == true) {
                        navigate("/admin/notification_list");
                        return
                    }
                    if(response.data.permission?.transactionPermission == true) {
                        navigate("/admin/transaction_list");
                        return
                    }
                }
                else {
                    navigate("/admin/user_list");
                }
            })
            .catch(function (error) {
                if (error.response?.status === 401) {
                    toast.error(error.response.data.message);
                  }
                  if (error.response?.status === 500) {
                    toast.error(error.response.data.message);
                  }
            });
    }

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
                                <Input
                                    id="examplePassword"
                                    name="password"
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </FormGroup>
                            <div className="text-center">
                                <Button className="mt-2" onClick={LoginButton}>Submit</Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};

export default Login;
