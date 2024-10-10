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
    daysGone,
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
                <strong>Start date:</strong> {startDate}
            </p>
            <p>
                <strong>End date:</strong> {endDate}
            </p>
            <p>
                <strong>Days Gone:</strong> {daysGone}
            </p>
            <p>
                <strong>Weather:</strong> {weather}
            </p>
        </div>
    );
};

export default TripDetails;
