import jwtDecode from 'jwt-decode';

export const verifyToken = (token) => {
	try {
		return jwtDecode(token, { header: true });
	} catch (error) {
		// TODO: Need to proper error handling here
	}
};

export const decodeToken = (token) => {
	try {
		return jwtDecode(token);
	} catch (error) {
		// TODO: Need to proper error handling here
	}
};
