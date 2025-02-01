import { formatDate } from '../utils/utilities';

interface WeatherData {
    daily: Array<{
        dt: number;
        temp: { day: number };
        weather: Array<{ description: string }>;
        humidity: number;
    }>;
}

interface TripDetailsProps {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysGone: number;
    weather: WeatherData | null;
    daysUntilTripStart: number;
}

const TripDetails = ({
    name,
    destination,
    startDate,
    endDate,
    daysGone,
    weather,
}: TripDetailsProps): JSX.Element => {
    const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0) / 1000;
    // Hack for displaying weather for last day
    const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999) / 1000;

    const emojiGeneratorWeather = (description: string): string => {
        if (description.includes('rain')) {
            return '🌧️';
        } else if (description.includes('cloud')) {
            return '☁️';
        } else if (
            description.includes('clear') ||
            description.includes('sun')
        ) {
            return '☀️';
        } else if (description.includes('snow')) {
            return '❄️';
        } else if (
            description.includes('storm') ||
            description.includes('thunder')
        ) {
            return '🌩️';
        }
        return '';
    };

    const emojiGeneratorTemperature = (temperature: number): string => {
        if (temperature < 0) {
            return '🥶';
        } else if (temperature >= 20 && temperature < 30) {
            return '😎';
        } else if (temperature >= 30) {
            return '🥵🔥';
        }
        return '';
    };

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
                <strong>Start Date:</strong> {formatDate(startDate)}
            </p>
            <p>
                <strong>End Date:</strong> {formatDate(endDate)}
            </p>
            <p>
                <strong>Nights gone:</strong> {daysGone}
            </p>

            {weather ? (
                <div>
                    <h3>Weather Forecast for Trip</h3>
                    {weather.daily.length > 0 ? (
                        weather.daily
                            .filter(
                                (day) =>
                                    day.dt >= startTimestamp &&
                                    day.dt <= endTimestamp,
                            )
                            .map((day, index) => {
                                console.log('day', day); // Log the value of day
                                return (
                                    <div key={index}>
                                        <p>
                                            <strong>Date:</strong>{' '}
                                            {formatDate(
                                                new Date(
                                                    day.dt * 1000,
                                                ).toISOString(),
                                            )}
                                        </p>
                                        <p>
                                            <strong>Temperature:</strong>{' '}
                                            {Math.round(day.temp.day)}°C
                                            {emojiGeneratorTemperature(
                                                Math.round(day.temp.day),
                                            )}
                                        </p>
                                        <p>
                                            <strong>Conditions:</strong>{' '}
                                            {day.weather[0].description}{' '}
                                            {emojiGeneratorWeather(
                                                day.weather[0].description,
                                            )}
                                        </p>
                                        <p>
                                            <strong>Humidity:</strong>{' '}
                                            {day.humidity}%
                                        </p>
                                    </div>
                                );
                            })
                    ) : (
                        <p>No weather data available for the trip dates.</p>
                    )}
                </div>
            ) : (
                <p>Weather data not available yet.</p>
            )}
        </div>
    );
};

export default TripDetails;
