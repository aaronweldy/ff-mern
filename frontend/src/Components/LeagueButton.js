import {Button} from 'react-bootstrap'
import '../CSS/LeaguePages.css'

export default function LeagueButton(props) {
    return (
        <Button className="left-corner ml-3" href={'/league/' + props.id + '/'} variant="primary">Back to league home</Button>
    )
}