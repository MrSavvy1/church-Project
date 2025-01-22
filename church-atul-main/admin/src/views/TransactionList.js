import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { Row, Col, Card, CardBody, Button, Input, FormGroup } from "reactstrap";
import { toast } from "react-toastify";
import DataTable from 'react-data-table-component';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import Logo from '../assets/images/logos/logo.png';

const TransactionList = () => {
    const [transactionList, setTransactionList] = useState([]);

    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [churchName, setChurchname] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date());
    let _user = localStorage.getItem('user');
    let user = JSON.parse(_user);
    let _permission = localStorage.getItem('permission');
    let permission = JSON.parse(_permission);
    const targetRef = useRef();

    let filteredItems = transactionList.filter(
        item => {
            let isNameMatch = item?.userName?.toLowerCase().includes(userName?.toLowerCase() || '');
            let isEmailMatch = item?.userEmail?.toLowerCase().includes(userEmail?.toLowerCase() || '');
            let isTypeMatch = item?.type?.toLowerCase().includes(type?.toLowerCase() || '');
            let isChurchMatch = item?.church?.toLowerCase().includes(churchName?.toLowerCase() || '');
            let isAmountMatch = item?.amount?.toString().toLowerCase().includes(amount?.toLowerCase() || '');
            let isDateRangeMatch = true;
            if (startDate) {
                const itemDate = new Date(item?.created);
                const startDateObj = new Date(startDate);
                let endDateObj = new Date();
                if (endDate !== '') {
                    endDateObj = new Date(endDate);
                }
                isDateRangeMatch = itemDate >= startDateObj && itemDate <= endDateObj;
                if (startDate === endDate) {
                    isDateRangeMatch = itemDate.toDateString() === startDateObj.toDateString();
                }
            }

            return (
                isNameMatch &&
                isTypeMatch &&
                isChurchMatch &&
                isAmountMatch &&
                isDateRangeMatch &&
                isEmailMatch
            );
        }
    );

    const columns = [
        {
            name: 'User',
            cell: row => (
                <div className="d-flex flex-row align-items-center">
                    <img src={row.avatarUrl} style={{ width: 35, height: 35, objectFit: 'cover', marginRight: 10, borderRadius: '50%' }} alt="userAvatar" />
                    <div className="d-flex flex-column">
                        <div>{row.userName === '' ? 'Not set' : row.userName}</div>
                        <div>{row.userEmail}</div>
                    </div>
                </div>
            )
        },
        {
            name: 'Church Name',
            selector: row => row.church,
            sortable: true,
        },
        {
            name: 'Amount',
            selector: row => {
                const amount = parseFloat(row.amount) || 0;
                return user.role === 'super' ? (amount * 0.98).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : (amount * 0.98).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            },
            sortable: true,
        },
        ...(user.role === 'super' ? [
           /* {
                name: 'Commission',
                selector: row => {
                    const amount = parseFloat(row.amount) || 0;
                    return (amount * 0.02).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                },
                sortable: true,
            }, */
            {
                name: 'Total Amount',
                selector: row => {
                    const amount = parseFloat(row.amount) || 0;
                    return amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                },
                sortable: true,
            }
        ] : []),
        {
            name: 'Type',
            selector: row => row.type,
            sortable: true,
        },
        {
            name: 'Created',
            selector: row => format(new Date(row.created), 'dd-MM-yyyy p'),
            sortable: true,
        },
    ];

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
    };

    const capitalizeHeaders = (headers) => {
        return headers.map(header => header.toUpperCase());
    };

    const exportToExcel = () => {
        const filteredForExcel = filteredItems.map(item => {
            const amount = parseFloat(item.amount) || 0;
            return {
                userName: item.userName,
                church: item.church,
                amount: user.role === 'super' ? formatAmount(amount * 0.98) : formatAmount(amount * 0.98),
                ...(user.role === 'super' ? {
                    commission: formatAmount(amount * 0.02),
                    totalAmount: formatAmount(amount),
                    email: item.userEmail
                } : {}),
                type: item.type,
                created: format(new Date(item.created), 'p dd-MM-yyyy')
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredForExcel);
        const headers = capitalizeHeaders(Object.keys(filteredForExcel[0]));
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, "Transactions.xlsx");
    };

    const subHeaderComponentMemo = useMemo(() => {
        const handleClear = () => {
            if (userEmail || churchName || amount || type || startDate || endDate) {
                setUserEmail('');
                setChurchname('');
                setAmount('');
                setType('');
                setStartDate('');
                setEndDate(new Date());
            }
        };
        return (
            <Row>
                <Col sm={12} md={2}>
                    <FormGroup>
                        <Button onClick={exportToExcel}>Export to Excel</Button>
                    </FormGroup>
                </Col>
                <Col sm={12} md={2}>
                    <FormGroup>
                        <Input
                            id="exampleEmail"
                            name="name"
                            placeholder="UserName"
                            type="text"
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={3}>
                    <FormGroup>
                        <Input
                            id="exampleEmail"
                            name="email"
                            placeholder="UserEmail"
                            type="text"
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={3}>
                    <FormGroup>
                        <Input
                            id="exampleEmail"
                            name="email"
                            placeholder="Church Name"
                            type="text"
                            value={churchName}
                            onChange={(e) => setChurchname(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={2}>
                    <FormGroup>
                        <Input
                            id="exampleEmail"
                            name="email"
                            placeholder="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={3}>
                    <FormGroup>
                        <Input
                            id="exampleSelect"
                            name="select"
                            type="select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">
                                Select Type
                            </option>
                            <option value="Offering">
                                Offering
                            </option>
                            <option value="Tithe">
                                Tithe
                            </option>
                            <option value="Project">
                                Project
                            </option>
                        </Input>
                    </FormGroup>
                </Col>
                <Col sm={12} md={3}>
                    <FormGroup>
                        <Input
                            name="startDate"
                            id="exampleEmail"
                             placeholder="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={3}>
                    <FormGroup>
                        <Input
                            name="endDate"
                            id="exampleEmail"
                            placeholder="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col sm={12} md={3} className="text-center">
                    <FormGroup>
                        <Button onClick={handleClear} className="w-100">Clear</Button>
                    </FormGroup>
                </Col>
            </Row>
        );
    }, [userEmail, churchName, amount, type, transactionList, filteredItems]);

    const getTransaction = async () => {
        const token = localStorage.getItem('token');
        const headers = {
            authorization: `${token}`
        };
        await axios.get(`${process.env.REACT_APP_SERVER_API_URL}/api/transaction/get_all_transactions`, { headers })
            .then(function (response) {
                const transactions = [];
                for (let i = 0; i < response.data.transaction.length; i++) {
                    let transaction = {
                        id: i,
                        avatarUrl: response.data.transaction[i]?.userId?.avatarUrl,
                        userEmail: response.data.transaction[i]?.userId?.userEmail,
                        userName: response.data.transaction[i]?.userId?.userName,
                        church: response.data.transaction[i]?.churchId?.churchName,
                        amount: response.data.transaction[i]?.amount,
                        type: response.data.transaction[i]?.type,
                        created: response.data.transaction[i]?.createdDate
                    };

                    transactions.push(transaction);
                }
                setTransactionList(transactions);
            })
            .catch(function (error) {
                toast.error(error.message);
            });
    };

    const adminGetTransactionList = async () => {
        const token = localStorage.getItem('token');
        const headers = {
            authorization: `${token}`
        };
        let data = {
            church: permission.church
        };
        await axios.post(`${process.env.REACT_APP_SERVER_API_URL}/api/transaction/admin_get_transaction_list`, data, { headers })
            .then(function (response) {
                const transactions = [];
                for (let i = 0; i < response.data.transaction.length; i++) {
                    let transaction = {
                        id: i,
                        avatarUrl: response.data.transaction[i]?.userId?.avatarUrl,
                        userEmail: response.data.transaction[i]?.userId?.userEmail,
                        userName: response.data.transaction[i]?.userId?.userName,
                        church: response.data.transaction[i]?.churchId?.churchName,
                        amount: response.data.transaction[i]?.amount,
                        type: response.data.transaction[i]?.type,
                        created: response.data.transaction[i]?.createdDate
                    };

                    transactions.push(transaction);
                }
                setTransactionList(transactions);
            })
            .catch(function (error) {
                toast.error(error.message);
            });
    };

    useEffect(() => {
        setUserEmail('');
        setChurchname('');
        setAmount('');
        setType('');
        setStartDate('');
        setEndDate(new Date());
        if (user?.role === 'super') {
            getTransaction();
        } else {
            adminGetTransactionList();
        }
    }, []);

    useEffect(() => {
        console.log('start date', startDate);
        console.log('end date', endDate);
    }, [startDate, endDate]);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <>
            <Row>
                <Col>
                    <Card className="transaction-table">
                        <CardBody>
                            <DataTable title="Transactions" subHeader subHeaderComponent={subHeaderComponentMemo} pagination columns={columns} data={filteredItems} defaultSortFieldId={5} defaultSortAsc={false}/>
                            <div ref={targetRef} className="px-3 position-fixed bottom-100 z-0">
                                <hr />
                                <div className="text-center d-flex align-items-center justify-content-between py-5 px-3">
                                    <strong className="ms-2 fs-2">Church Transactions</strong>
                                    <img src={Logo} width={50} className="rounded-5" />
                                </div>
                                <hr />
                                <div className="px-3">
                                    <div className="fs-5 fw-bold">Filter Conditions</div>
                                    {userEmail !== '' && (<span className="me-5">User Email: {userEmail}</span>)}
                                    {userName !== '' && (<span className="me-5">User Name: {userName}</span>)}
                                    {churchName !== '' && (<span className="me-5">Church Name: {churchName}</span>)}
                                    {amount !== '' && (<span className="me-5">Amount: {amount}</span>)}
                                    {type !== '' && (<span className="me-5">Type: {type}</span>)}
                                    {startDate !== '' && (<span className="me-5">Start Date: {startDate}</span>)}
                                </div>
                                <hr />
                                <DataTable columns={columns} data={filteredItems} defaultSortFieldId={1} />
                                <hr />
                                <div className="text-end fw-bold fs-5 mb-2">
                                    Total Amount: {(filteredItems.reduce((accumulator, currentValue) => {
                                        const amount = parseFloat(currentValue.amount) || 0;
                                        return accumulator + (amount * (user.role === 'super' ? 1 : 0.98));
                                    }, 0)).toLocaleString()}
                                </div>
                                <div className="text-end fw-bold">{formattedDate}</div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default TransactionList;