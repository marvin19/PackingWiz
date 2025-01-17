import { formatDate, calculateDaysGone } from '../utils/utilities';

interface TripDetailsProps {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysGone: number;
    weather: string;
}

const TripDetails = ({
    name,
    destination,
    startDate,
    endDate,
    weather,
}: TripDetailsProps): JSX.Element => {
    return (
        <div>
            <h2>Trip Details</h2>
            <p>
                <strong>Name:</strong> {name}
            </p>
            <p>
                <strong>Destination:</strong> {destination}
            </p>
            <p>
                <strong>Start date:</strong> {formatDate(startDate)}
            </p>
            <p>
                <strong>End date:</strong> {formatDate(endDate)}
            </p>
            <p>
                <strong>Days Gone:</strong>{' '}
                {calculateDaysGone(startDate, endDate)}
            </p>
            <p>
                <strong>Weather:</strong> {weather}
            </p>
        </div>
    );
};

export default TripDetails;
