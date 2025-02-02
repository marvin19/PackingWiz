import { formatDate } from '../utils/utilities';

interface FilteredWeatherData {
    daily: Array<{
        date: string;
        temp: number;
        conditions: string;
        humidity: number;
    }>;
}

interface TripDetailsProps {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysGone: number;
    weather: FilteredWeatherData | null;
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
        } else if (temperature >= 0 && temperature < 10) {
            return '🙂';
        } else if (temperature >= 10 && temperature < 20) {
            return '😊';
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
                    <h3 className="weather-h3">Weather Forecast for Trip</h3>
                    {weather?.daily && weather.daily.length > 0 ? (
                        weather.daily
                            .filter((day) => {
                                const tripStart = new Date(startDate)
                                    .toISOString()
                                    .split('T')[0];
                                const tripEnd = new Date(endDate)
                                    .toISOString()
                                    .split('T')[0];

                                return (
                                    day.date >= tripStart && day.date <= tripEnd
                                );
                            })
                            .map((day, index) => (
                                <div key={index} className="weather-day">
                                    <p>
                                        <strong>Date:</strong>{' '}
                                        {formatDate(day.date)}
                                    </p>
                                    <p>
                                        <strong>Temperature:</strong> {day.temp}
                                        °C {emojiGeneratorTemperature(day.temp)}
                                    </p>
                                    <p>
                                        <strong>Conditions:</strong>{' '}
                                        {day.conditions}{' '}
                                        {emojiGeneratorWeather(day.conditions)}
                                    </p>
                                    <p>
                                        <strong>Humidity:</strong>{' '}
                                        {day.humidity}%
                                    </p>
                                </div>
                            ))
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
