import { formatDate, calculateDaysGone } from '../utils/utilities';

interface WeatherData {
    current: {
        temp: number;
        humidity: number;
        weather: { description: string }[];
    };
}

interface TripDetailsProps {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysGone: number;
    weather: WeatherData | null;
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
            <div>
                <h3>Weather forecast</h3>
                <p>
                    <strong>Temperature:</strong> {weather?.current.temp}°C
                </p>
                <p>
                    <strong>Conditions:</strong>{' '}
                    {weather?.current.weather[0].description}
                </p>
                <p>
                    <strong>Humidity:</strong> {weather?.current.humidity}%
                </p>
            </div>
        </div>
    );
};

export default TripDetails;
