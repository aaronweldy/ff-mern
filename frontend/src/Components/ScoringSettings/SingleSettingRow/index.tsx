import { positionTypes, scoringTypes } from "@ff-mern/ff-types";
import { Row, Col, Button, Form } from "react-bootstrap";
import { CategoryChange, MinimumChange, ModifiableSetting } from "..";

type SingleSettingRowProps = {
  setting: ModifiableSetting;
  index: number;
  handleRemoveSetting: (index: number) => void;
  handleSettingChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: "points" | "position"
  ) => void;
  handleCategoryChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: CategoryChange
  ) => void;
  handleMinimumChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    settingIdx: number,
    minIdx: number,
    name: MinimumChange
  ) => void;
  handleRemoveMinimum: (settingIdx: number, minIdx: number) => void;
  handleAddMinimum: (settingIdx: number) => void;
};
export const SingleSettingRow = ({
  setting,
  index,
  handleSettingChange,
  handleRemoveSetting,
  handleCategoryChange,
  handleMinimumChange,
  handleRemoveMinimum,
  handleAddMinimum,
}: SingleSettingRowProps) => (
  <Row className="mb-5">
    <Col md={1} className="d-flex justify-content-center align-items-center">
      <Button
        onClick={() => handleRemoveSetting(index)}
        variant="danger"
        size="sm"
      >
        {"\u00D7"}
      </Button>
    </Col>
    <Col md={2} className="d-flex align-items-center">
      <Form.Control
        as="select"
        value={setting.position}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          handleSettingChange(e, index, "position")
        }
      >
        {positionTypes.map((type, j) => (
          <option value={type} key={j}>
            {type}
          </option>
        ))}
      </Form.Control>
    </Col>
    <Col md={2} className="d-flex align-items-center">
      <Form.Control
        className="mr-3"
        value={setting.points}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleSettingChange(e, index, "points")
        }
        type="text"
      />{" "}
      {setting.points === "1" ? "point" : "points"}
    </Col>
    <Col md={2}>
      <Row>
        <Col>
          <Form.Control
            as="select"
            value={setting.category.qualifier || "per"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleCategoryChange(e, index, "qualifier")
            }
          >
            <option value="per">per</option>
            <option value="greater than">greater than</option>
            <option value="between">between</option>
          </Form.Control>
        </Col>
      </Row>
      {setting.category.qualifier === "between" ? (
        <Row>
          <Col>
            <Form.Control
              value={setting.category.thresholdMin || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleCategoryChange(e, index, "thresholdMin")
              }
              type="text"
            />
          </Col>
          and
          <Col>
            <Form.Control
              value={setting.category.thresholdMax || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleCategoryChange(e, index, "thresholdMax")
              }
              type="text"
            />
          </Col>
        </Row>
      ) : (
        <Row>
          <Col>
            <Form.Control
              value={setting.category.threshold || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleCategoryChange(e, index, "threshold")
              }
              type="text"
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <Form.Control
            name="statType"
            data-setting={index}
            as="select"
            value={setting.category.statType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleCategoryChange(e, index, "statType")
            }
          >
            {scoringTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </Form.Control>
        </Col>
      </Row>
    </Col>
    {setting.minimums.map((min, j) => (
      <Col key={j} md={2} className="d-flex flex-column align-items-center">
        <Row>
          <Col>
            <span>Minimum:</span>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col className="p-0">
            <Form.Control
              value={min.threshold || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleMinimumChange(e, index, j, "threshold")
              }
              type="text"
            />
          </Col>
          <Col>
            <Form.Control
              as="select"
              defaultValue={min.statType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleMinimumChange(e, index, j, "statType")
              }
            >
              {scoringTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </Form.Control>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleRemoveMinimum(index, j)}
            >
              Remove Minimum
            </Button>
          </Col>
        </Row>
      </Col>
    ))}
    <Col className="d-flex align-items-center">
      <Button onClick={() => handleAddMinimum(index)} variant="primary">
        Add new minimum
      </Button>
    </Col>
  </Row>
);
