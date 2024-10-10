interface TripDetailsProps {
    name: string;
    destination: string;
    date: string;
    daysGone: number;
    weather: string;
}

const TripDetails = ({
    name,
    destination,
    date,
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
                <strong>Date:</strong> {date}
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
